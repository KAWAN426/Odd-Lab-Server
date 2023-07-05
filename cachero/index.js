import { create } from "./create.js"
import { deleteData } from "./delete.js"
import { select } from "./select.js"
import { update } from "./update.js"

export const createCachero = (pool, redis) => {
  return newCachero(pool, redis)
}

const newCachero = (pool, redis) => {
  const info = { redis, data: [], table: "", cachedKey: [], count: 0, deleted: [] }
  return {
    getTable: (table) => {
      info.table = table;
      return {
        select: (selectData, props, key) => select(info, pool, selectData, props, key),
        create: (newData) => { create(info, newData); info.count++; },
        update: (newData) => { update(info, newData); info.count--; },
        delete: (id) => deleteData(info, id),

      }
    },
    setting: async ({ preloadData, pool, redis }) => {
      info.pool = pool;
      if (preloadData) info.data = [...preloadData];
      if (redis) info.redis = redis;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${info.table};`);
      info.count = countResult;
    }
  }
}