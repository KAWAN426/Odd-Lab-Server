const getData = ({ sort, page, select, unselect, filter }) => {

}

export const createCachero = (cacheName) => {
  const cache = { count: 0, data: [], name: cacheName }
  const setCount = (count) => cache.count = count
  const getCount = () => cache.count
  const getData = () => cache.data
  const cSort = (standardKey, standardType, orderType) => sortData(cache, standardKey, standardType, orderType)
  const cFilter = (keyName, filterVal) => filterByValue(cache, keyName, filterVal)
  const cMerge = (newData) => mergeData(cache, newData)
  const cCreate = (newData) => createData(cache, newData)
  const cRemove = (id) => removeDataById(cache, id)
  const middleware = ({ data, res, page }) => {
    if (String(data.length) === String(cache.count)) {
      if (page && data.length >= page.pageSize + page.offset) return res.json(data);
      else return res.json(data);
    }
  }
  return { getCount, getData, setCount, cSort, cFilter, cMerge, cCreate, cRemove, middleware }
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

// function getDataByKey(data, key, value) {
//   const result = data.filter((obj) => obj[key] === value)[0]
//   result.paginate = (page, pageSize) => {
//     const startIndex = (page - 1) * pageSize;
//     const endIndex = startIndex + pageSize;

//     return result.slice(startIndex, endIndex);
//   }
//   result.pickData = (keys) => pickData(result, keys)
//   result.omitData = (keys) => omitData(result, keys)

//   return result
// }

function filterByValue({ data }, keyName, filterVal) {
  const result = data.filter((value) => value[keyName] === filterVal)
  const get = () => result
  const select = (keys) => pickData(result, keys)
  const unselect = (keys) => omitData(result, keys)
  const paginate = (page, pageSize) => paginateData(result, page, pageSize)
  return { get, select, unselect, paginate }
}

function sortData({ data }, standardKey, standardType, orderType) {
  const getSortFunc = () => {
    if (standardType === "date") {
      if (orderType === "DESC") return (a, b) => Number(new Date(b[standardKey])) - Number(new Date(a[standardKey]))
      else return (a, b) => Number(new Date(a[standardKey])) - Number(new Date(b[standardKey]))
    }
    else if (standardType === "string") {
      if (orderType === "DESC") return (a, b) => b[standardKey].localeCompare(a[standardKey])
      else return (a, b) => a[standardKey].localeCompare(b[standardKey])
    }
    else if (standardType === "number") {
      if (orderType === "DESC") return (a, b) => b[standardKey] - a[standardKey]
      else return (a, b) => a[standardKey] - b[standardKey]
    }
  }
  const result = data.sort(getSortFunc())
  const get = () => result
  const select = (keys) => pickData(result, keys)
  const unselect = (keys) => omitData(result, keys)
  const paginate = (page, pageSize) => paginateData(result, page, pageSize)
  return { get, select, unselect, paginate };
}

function removeDataById({ data, count }, id) {
  // 배열에서 특정 id를 가진 오브젝트를 제거하는 함수
  const index = data.findIndex(obj => obj.id === id); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    count--;
    data.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
  }
}

function createData({ data, count }, newData) {
  count++;
  return data.push(newData)
}

function mergeData({ data }, newArray) {
  newArray.forEach(newObj => {
    const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      data.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  return data;
}