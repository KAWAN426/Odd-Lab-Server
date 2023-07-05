export function create({ data, redis, table }, newData) {
  const result = data.push(newData)
  if (redis) redis.set(table, JSON.stringify(result))
}