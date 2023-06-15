
// ? 여기서 기능 구현
export const createCachero = () => {
  const data = []
  const getAllData = () => data
  const getOneData = (key:string,value:any) => getDataByKey(data,key,value)
  const getSortedData = (standardKey:string, standardType:"date" | "string" | "number", orderType?:"DESC" | "ASC") => sortData(data,standardKey,standardType,orderType)
  const getFilteredData = (keyName:string,filterVal:any) => filterByValue(data,keyName,filterVal)
  const sliceDataByPage = (data:any[],page:number,pageSize:number) => paginateData(data,page,pageSize)
  const appendData = (newData) => addDataToArray(data, newData)
  const removeData = (id) => removeObjectById(data, id)
  return { getAllData,getOneData,getSortedData,getFilteredData, appendData, removeData, sliceDataByPage }
}

function paginateData(data:any[], page:number, pageSize:number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return data.slice(startIndex, endIndex);
}

function getDataByKey(data:any[], key:string,value:any) {
  return data.filter((obj:Object) => obj[key] === value)[0]
}

function filterByValue(data:any[], keyName:string, filterVal:any) {
  return data.filter((value)=>value[keyName]===filterVal)
}

function sortData(data:any[], standardKey:string, standardType:"date" | "string" | "number", orderType?:"DESC" | "ASC") {
  const getSortFunc = (): ((a:Object,b:Object) => any) => {
    if(standardType === "date") {
      if(orderType === "DESC") return (a,b) => Number(new Date(b[standardKey])) - Number(new Date(a[standardKey]))
      else return (a,b) => Number(new Date(a[standardKey])) - Number(new Date(b[standardKey]))
    }
    else if(standardType === "string") {
      if(orderType === "DESC") return (a,b) => b[standardKey].localeCompare(a[standardKey])
      else return (a,b) => a[standardKey].localeCompare(b[standardKey])
    }
    else if(standardType === "number") {
      if(orderType === "DESC") return (a,b) => a[standardKey] - b[standardKey]
      else return (a,b) => a[standardKey] - b[standardKey]
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

function addDataToArray(array, newData) {
  // * 새로운 데이터를 배열로 전달한 경우
  if (Array.isArray(newData)) {
    newData.forEach(newObject => {
      const existingObjectIndex = array.findIndex(obj => obj.id === newObject.id);

      if (existingObjectIndex !== -1) {
        // * 이미 동일한 id를 가지는 오브젝트가 있을 경우, 덮어쓰기
        array[existingObjectIndex] = newObject;
      } else {
        // * 동일한 id를 가지는 오브젝트가 없을 경우, 새로 추가
        array.push(newObject);
      }
    });
  } else {
    // * 새로운 데이터를 단일 오브젝트로 전달한 경우
    const existingObjectIndex = array.findIndex(obj => obj.id === newData.id);

    if (existingObjectIndex !== -1) {
      // * 이미 동일한 id를 가지는 오브젝트가 있을 경우, 덮어쓰기
      array[existingObjectIndex] = newData;
    } else {
      // * 동일한 id를 가지는 오브젝트가 없을 경우, 새로 추가
      array.push(newData);
    }
  }
}

