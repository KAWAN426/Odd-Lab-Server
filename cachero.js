import { pool, redis } from "./declare.js"

export const createCachero = (cacheName) => {
  const data = []
  const info = { count: 0, name: cacheName }
  const setCount = (count) => info.count = count
  const getCount = () => info.count
  const getData = () => data
  const cSort = (keys, sortOrder) => sortData(data, keys, sortOrder)
  const cFilter = (keyName, filterVal) => filterByValue(data, keyName, filterVal)
  const cMerge = (newData) => mergeData(data, newData)
  const cCreate = (newData) => { createData(data, newData); info.count++; }
  const cRemove = (id) => { removeDataById(data, id); info.count--; }
  const middleware = ({ data, res, page }) => {
    if (String(data.length) === String(info.count)) {
      console.log("cachero hit!")
      if (page && data.length >= page.pageSize + page.offset) return res.json(data);
      else return res.json(data);
    }
  }
  const scheduler = (times) => cacheScheduler(times, saveAllDatas, data)
  return { setCount, getCount, getData, cSort, cFilter, cMerge, cCreate, cRemove, middleware, scheduler }
}

function cacheScheduler(times, fn, data) {
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
        fn(data);
        break;
      }
    }
  }, 60000); // 1분(60초)마다 체크

  // 스케줄러 중지 함수
  function cancel() {
    clearInterval(intervalId);
  }

  // 스케줄러 중지 함수를 반환
  return cancel;
}

async function saveAllDatas(datas) {
  const upsertQuery = `
    INSERT INTO lab (id, title, maker_id, objects, background_img, combinate, start_obj, end_obj, liked_user, find_obj, created_at, updated_at)
    VALUES
      ${datas.map((_, index) => `($${index * 12 + 1}, $${index * 12 + 2}, $${index * 12 + 3}, $${index * 12 + 4}, $${index * 12 + 5}, $${index * 12 + 6}, $${index * 12 + 7}, $${index * 12 + 8}, $${index * 12 + 9}, $${index * 12 + 10}, $${index * 12 + 11}, $${index * 12 + 12})`).join(', ')}
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

  const values = datas.reduce((acc, data) => {
    acc.push(
      data.id,
      data.title,
      data.maker_id,
      data.objects,
      data.background_img,
      data.combinate,
      data.start_obj,
      data.end_obj,
      data.liked_user,
      data.find_obj,
      data.created_at,
      data.updated_at
    );
    return acc;
  }, []);


  await pool.query(upsertQuery, values);
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

function filterByValue(data, keyName, filterVal) {
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

function sortData(data, keys, sortOrder = 'ASC') {
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

function removeDataById(data, id) {
  // 배열에서 특정 id를 가진 오브젝트를 제거하는 함수
  const index = data.findIndex(obj => obj.id === id); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    // count--;
    data.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
  }
}

function createData(data, newData) {
  return data.push(newData)
}

async function mergeData(data, newArray) {
  const deepCopyData = JSON.parse(JSON.stringify(newArray))
  deepCopyData.forEach(newObj => {
    const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      data.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  await data.forEach((obj) => {
    const value = JSON.stringify(obj);
    redis.sAdd("lab", value);
  });

  // * 저장한 데이터 가져오는 코드
  // const members = await redis.sMembers("lab")
  // const result = Array.from(members).map((value) => JSON.parse(value));
  // console.log(result)

  return data;
}