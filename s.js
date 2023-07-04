const createCachero = (pool) => {
  return newCachero(pool)
}

const newCachero = (pool) => {
  return {
    getTable: async ({ table, preload }) => {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table};`)
      const info = { data: [], table, cachedKey: [], count: countResult.rows[0].count },
      return {
        select: (key, selectData) => select(info, key, selectData),

      }
    }
  }
}


const select = ({ table, data, count, cachedKey }, key, selectData) => {
  if (cachedKey.includes(key) && data.length === count) {

  }
  let selectQuery = `${table}.*`
  if (selectData.column) {
    selectData.column.map(([name, data]) => {
      selectQuery += `, ${data} AS ${name}`
    })
  }

  selectQuery = `SELECT ${selectQuery} FROM ${table}`

  if (selectData.with) {
    selectData.with.map(({ }) => {
      selectQuery +=
    })
  }

  return {
    order: () => { },
    search: () => { },
    equal: () => { },
    with: () => { },
    limit: () => { },
    paginate: () => { },
  }
}

const cachero = createCachero(pool)

const labTable = cachero.getTable({ table: "lab", preload: false })

const integrity = {
  data: "username",
  equal: {
    table: "users",
  },
  notEqual: ""
}

const withData = {
  table: "users",
  targetData: "id",
  ownerData: "makerId"
}
const search = {
  name: "title",
  keyword: ["%keyword%"]
}

select({
  column: [
    "COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count",
    "users.name AS maker_name",
    "users.profile_img AS maker_img",
  ],
  order: ["created_at DESC"],
  join: ["lab.maker_id = users.id"],
  limit: 30,
  offset: 0,
  where: {
    condition2: ["column1", ">", "1"],
    condition3: ["column1", "IN", ["1", "2"]],
    result: ["condition1", "AND", "condition2", "OR", "condition3"]
  },
})

labTable.select({ name: "like_count", data: "COALESCE(ARRAY_LENGTH(liked_user, 1), 0)" }).order("created_at DESC").with(withData).paginate(1, 30)
labTable.select().search(search).with(withData).paginate(1, 30)
labTable.select().equal(["id", "0"]).with(withData).paginate(1, 30)
labTable.select().with(withData).limit(30)

labTable.create(data).checkIntegrity(integrity)

labTable.update(data, { id: "0" }).checkIntegrity(integrity)

labTable.delete({ id: "0" })

//!!!@!////////////////////////////

const data = [
  { column1: 1, column2: 'A' },
  { column1: 2, column2: 'B' },
  { column1: 3, column2: 'C' },
];

function evaluateCondition(condition, item) {
  const [key, operator, value] = condition;
  switch (operator) {
    case '>':
      return item[key] > value;
    case '<':
      return item[key] < value;
    case 'IN':
      return value.includes(item[key]);
    default:
      return false;
  }
}

function filterData(array, conditions) {
  const resultCondition = conditions.result;
  return array.filter((item) => {
    return resultCondition.reduce((accumulator, condition, index) => {
      if (index === 0) {
        return evaluateCondition(condition, item);
      }

      const logicalOperator = condition;
      const nextCondition = conditions[`condition${index + 1}`];

      if (logicalOperator === 'AND') {
        return accumulator && evaluateCondition(nextCondition, item);
      } else if (logicalOperator === 'OR') {
        return accumulator || evaluateCondition(nextCondition, item);
      }

      return accumulator;
    });
  });
}

// Example usage
const filteredData = filterData(data, {
  condition1: ['column2', '===', 'B'],
  condition2: ['column1', '>', 1],
  condition3: ['column1', 'IN', ['1', '2']],
  result: ['condition1', 'AND', 'condition2', 'OR', 'condition3'],
});

console.log(filteredData);