
// ? 여기서 기능 구현
export const createCachero = (cacheName) => {
  const data = []
  const dataCount = { count: 0 }

  const getAllData = () => data
  const getDataCount = () => dataCount.count
  const setDataCount = (newCount) => dataCount.count = newCount
  // const getOneData = (key, value) => getDataByKey(data, key, value)
  const getSortedData = (standardKey, standardType, orderType) => sortData(data, standardKey, standardType, orderType)
  const getFilteredData = (keyName, filterVal) => filterByValue(data, keyName, filterVal)
  const appendData = (newData) => mergeObjectsById(data, newData, dataCount)
  const removeData = (id) => removeObjectById(data, id)
  return { getAllData, getDataCount, setDataCount, getSortedData, getFilteredData, appendData, removeData }
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
  pickedData.paginate = (page, pageSize) => paginateData(pickedData, page, pageSize)
  return pickedData
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
  omitedData.paginate = (page, pageSize) => paginateData(omitedData, page, pageSize)
  return omitedData
}

function paginateData(data, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const result = data.slice(startIndex, endIndex)
  result.select = (key) => pickData(result, key)
  result.unselect = (key) => omitData(result, key)
  return result;
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

function filterByValue(data, keyName, filterVal) {
  const result = data.filter((value) => value[keyName] === filterVal)
  result.select = (keys) => pickData(result, keys)
  result.unselect = (keys) => omitData(result, keys)
  result.paginate = (page, pageSize) => paginateData(result, page, pageSize)
  return result
}

function sortData(data, standardKey, standardType, orderType) {
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
  result.select = (keys) => pickData(result, keys)
  result.unselect = (keys) => omitData(result, keys)
  result.paginate = (page, pageSize) => paginateData(result, page, pageSize)
  return result;
}

function removeObjectById(arr, id, dataCount) {
  // 배열에서 특정 id를 가진 오브젝트를 제거하는 함수
  const index = arr.findIndex(obj => obj.id === id); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    dataCount.count--;
    arr.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
  }
}

function mergeObjectsById(targetArray, newArray, dataCount) {
  newArray.forEach(newObj => {
    const existingObjIndex = targetArray.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      targetArray[existingObjIndex] = { ...targetArray[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      dataCount.count++;
      targetArray.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  return targetArray;
}