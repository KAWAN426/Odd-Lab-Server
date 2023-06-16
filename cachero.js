
// ? 여기서 기능 구현
export const createCachero = () => {
  const data = []
  const getAllData = () => data
  const getOneData = (key, value) => getDataByKey(data, key, value)
  const getSortedData = (standardKey, standardType, orderType) => sortData(data, standardKey, standardType, orderType)
  const getFilteredData = (keyName, filterVal) => filterByValue(data, keyName, filterVal)
  const sliceDataByPage = (data, page, pageSize) => paginateData(data, page, pageSize)
  const appendData = (newData) => mergeObjectsById(data, newData)
  const removeData = (id) => removeObjectById(data, id)
  return { getAllData, getOneData, getSortedData, getFilteredData, appendData, removeData, sliceDataByPage }
}

function paginateData(data, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return data.slice(startIndex, endIndex);
}

function getDataByKey(data, key, value) {
  return data.filter((obj) => obj[key] === value)[0]
}

function filterByValue(data, keyName, filterVal) {
  return data.filter((value) => value[keyName] === filterVal)
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
  return data.sort(getSortFunc());
}

function removeObjectById(arr, id) {
  // 배열에서 특정 id를 가진 오브젝트를 제거하는 함수
  const index = arr.findIndex(obj => obj.id === id); // 특정 id를 가진 오브젝트의 인덱스를 찾음

  if (index !== -1) {
    arr.splice(index, 1); // 해당 인덱스의 오브젝트를 배열에서 제거
  }
}

function mergeObjectsById(targetArray, newArray) {
  // const targetArray = [...targetArray];

  newArray.forEach(newObj => {
    const existingObjIndex = targetArray.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      targetArray[existingObjIndex] = { ...targetArray[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      targetArray.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  // console.log(targetArray)

  return targetArray;
}