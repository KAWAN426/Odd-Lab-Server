import { pool, redis } from "./declare.js"
import { refreshImage } from "./routes/image.js"

export const createCachero = (cacheName) => {
  const info = { count: 0, name: cacheName, cachedKey: [], data: [], deleted: [] }
  const getDeleted = () => info.deleted
  const setCount = (count) => info.count = count
  const getCount = () => info.count
  const getData = () => info.data
  const cSort = (keys, sortOrder) => sortData(info, keys, sortOrder)
  const cFilter = (keyName, filterVal) => filterByValue(info, keyName, filterVal)
  const cMerge = (newData, key) => mergeData(info, newData, key)
  const isCached = (key) => info.cachedKey.includes(key)
  const cCreate = (newData) => { createData(info, newData); info.count++; }
  const cRemove = (id) => { removeDataById(info, id); info.count--; }
  const batchSave = () => saveCacheBatch(info)
  const preload = () => preloadDataOnCache()
  const scheduler = (times) => cacheScheduler(times, [batchSave, preloadDataOnCache, refreshImage])
  return { setCount, getCount, getData, cSort, cFilter, cMerge, cCreate, cRemove, batchSave, scheduler, isCached, preload, getDeleted }
}

function cacheScheduler(times, fnArr) {
  // 주기적으로 현재 시간 체크
  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // times 배열을 순회하며 특정 시간에 함수 실행
    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i];

      // 시간과 분이 일치하는 경우 함수 실행
      if (currentHour === hour && currentMinute === minute) {
        fnArr.forEach(fn => fn());
        break;
      }
    }
  }, 60000); // 1분(60초)마다 체크

  // 스케줄러 중지 함수
  const cancel = () => clearInterval(intervalId)

  // 스케줄러 중지 함수를 반환
  return { cancel };
}

async function saveCacheBatch({ data, cachedKey }) {
  const upsertQuery = `
    INSERT INTO lab (id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, liked_user, find_obj, created_at, updated_at)
    VALUES
      ${data.map((_, index) => `($${index * 12 + 1}, $${index * 12 + 2}, $${index * 12 + 3}, $${index * 12 + 4}, $${index * 12 + 5}, $${index * 12 + 6}, $${index * 12 + 7}, $${index * 12 + 8}, $${index * 12 + 9}, $${index * 12 + 10}, $${index * 12 + 11}, $${index * 12 + 12})`).join(', ')}
    ON CONFLICT (id) DO UPDATE
    SET
      title = COALESCE(EXCLUDED.title, lab.title),
      maker_id = COALESCE(EXCLUDED.maker_id, lab.maker_id),
      objects = COALESCE(EXCLUDED.objects, lab.objects),
      background_img = COALESCE(EXCLUDED.background_img, lab.background_img),
      combinate = COALESCE(EXCLUDED.combinate, lab.combinate),
      start_obj = COALESCE(EXCLUDED.start_obj, lab.start_obj),
      end_obj = COALESCE(EXCLUDED.end_obj, lab.end_obj),
      liked_user = COALESCE(EXCLUDED.liked_user, lab.liked_user),
      find_obj = COALESCE(EXCLUDED.find_obj, lab.find_obj),
      updated_at = COALESCE(EXCLUDED.updated_at, lab.updated_at);
  `;

  const values = data.reduce((acc, value) => {
    acc.push(
      value.id,
      value.title,
      value.maker_id,
      value.objects,
      value.background_img,
      value.combinate,
      value.start_obj,
      value.end_obj,
      value.liked_user,
      value.find_obj,
      value.created_at,
      value.updated_at
    );
    return acc;
  }, []);

  await pool.query(upsertQuery, values);

  data.splice(0, data.length)
  cachedKey.splice(0, cachedKey.length)
}

async function preloadDataOnCache() {
  const newestResult = await pool.query(`
    SELECT lab.*,
    COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
    users.name AS maker_name, users.profile_img AS maker_img
    FROM lab 
    INNER JOIN users ON lab.maker_id = users.id
    ORDER BY created_at DESC
    LIMIT $1;
  `, [30 * 2]);
  const popularResult = await pool.query(`
    SELECT lab.*,
    COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count,
    users.name AS maker_name, users.profile_img AS maker_img
    FROM lab 
    INNER JOIN users ON lab.maker_id = users.id
    ORDER BY COALESCE(ARRAY_LENGTH(liked_user, 1), 0) DESC, created_at DESC
    LIMIT $1;
  `, [30 * 2]);

  const newestData = newestResult.rows
  const popularData = popularResult.rows


  newestData.forEach(newObj => {
    const existingObjIndex = popularData.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      popularData[existingObjIndex] = { ...popularData[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      popularData.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  redis.set("lab", JSON.stringify(popularData))
}

function pickData(data, keys) {
  const pickedData = data.map(obj => {
    const newObj = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  });
  const get = () => pickedData
  const paginate = (page, pageSize) => paginateData(pickedData, page, pageSize)
  return { get, paginate }
}

function omitData(data, keys) {
  const omitedData = data.map(obj => {
    const newObj = {};
    for (let key in obj) {
      if (!keys.includes(key)) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  });
  const get = () => omitedData
  const paginate = (page, pageSize) => paginateData(omitedData, page, pageSize)
  return { get, paginate }
}

function paginateData(data, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const result = data.slice(startIndex, endIndex)
  const get = () => result
  const select = (key) => pickData(result, key)
  const unselect = (key) => omitData(result, key)
  return { get, select, unselect };
}

function filterByValue({ data }, keyName, filterVal) {
  const result = data.filter((value) => value[keyName] === filterVal)
  const get = () => result
  const select = (keys) => pickData(result, keys)
  const unselect = (keys) => omitData(result, keys)
  const paginate = (page, pageSize) => paginateData(result, page, pageSize)
  const filter = (keyName, filterVal) => filterByValue(result, keyName, filterVal)
  const sort = (keys, sortOrder) => sortData(result, keys, sortOrder)
  return { get, select, unselect, paginate, sort, filter }
}

function isDate(value) {
  return !isNaN(Date.parse(value));
}

function sortData({ data }, keys, sortOrder = 'ASC') {
  data.sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (a[key] !== b[key]) {
        if (isDate(a[key]) && isDate(b[key])) {
          const dateA = new Date(a[key]);
          const dateB = new Date(b[key]);
          const comparison = dateA.getTime() - dateB.getTime();
          if (comparison !== 0) {
            return sortOrder === 'DESC' ? -comparison : comparison;
          }
        } else {
          const comparison = a[key] < b[key] ? -1 : 1;
          return sortOrder === 'DESC' ? -comparison : comparison;
        }
      }
    }
    return 0;
  });
  const result = data
  const get = () => result
  const select = (keys) => pickData(result, keys)
  const unselect = (keys) => omitData(result, keys)
  const paginate = (page, pageSize) => paginateData(result, page, pageSize)
  const sort = (keys, sortOrder) => sortData(result, keys, sortOrder)
  const filter = (keyName, filterVal) => filterByValue(result, keyName, filterVal)
  return { get, select, unselect, paginate, sort, filter };
}

async function removeDataById({ data, deleted }, id) {
  // 배열에서 특정 id를 가진 오브젝트를 제거하는 함수
  const index = data.findIndex(obj => obj.id === id); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    deleted.push(id)
    data.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
  }

  redis.set("lab", JSON.stringify(data))
}

async function createData(info, newData) {
  const result = info.data.push(newData)
  redis.set("lab", JSON.stringify(result))
  return result
}

async function mergeData(info, newArray, key) {
  const { data, cachedKey } = info
  cachedKey.push(key)
  const deepCopyData = JSON.parse(JSON.stringify(newArray))
  deepCopyData.forEach(newObj => {
    const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      data.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  redis.set("lab", JSON.stringify(data))

  return data;
}