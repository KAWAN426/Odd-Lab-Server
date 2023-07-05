import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"

export const createCachero = (pool, redis) => {
  return newCachero(pool, redis)
}

const newCachero = (pool, redis) => {
  return {
    getTable: async ({ table, preloadData }) => {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table};`)
      const info = { redis, data: [...preloadData], table, cachedKey: [], count: countResult.rows[0].count, deleted: [] }
      return {
        select: (selectData, props, key) => select(info, pool, selectData, props, key),
        create: (newData) => { create(info, newData); info.count++; },
        update: (newData) => { update(info, newData); info.count--; },
        delete: (id) => deleteData(info, id),
      }
    }
  }
}