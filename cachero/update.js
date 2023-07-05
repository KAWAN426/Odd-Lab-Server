export function update({ data, redis, table }, newData) {
  const deepCopyData = JSON.parse(JSON.stringify(newData))
  deepCopyData.forEach(newObj => {
    const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);

    if (existingObjIndex !== -1) {
      data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
    } else {
      data.push(newObj); // 새로운 오브젝트를 추가
    }
  });

  if (redis) redis.set(table, JSON.stringify(data))
}