import { redis } from "./declare.js"

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
  return { setCount, getCount, getData, cSort, cFilter, cMerge, cCreate, cRemove, middleware }
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