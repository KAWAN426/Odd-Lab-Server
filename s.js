const cachero = {
  getTable: (tableName) => {
    const getData = { query: '', tableName }
    return {
      select: (...columns) => select(getData, ...columns),

    }
  }
}

const select = ({ tableName, query }, ...columns) => {
  const columsText = columns.map((data) => {
    if (data === "*") return tableName + ".*"
    return columns
  }).join(", ")
  const selectQuery = `SELECT ${columsText} FROM ${tableName}`
  query = selectQuery
  return {
    order: () => { },
    search: () => { },
    equal: () => { },
    with: () => { },
    limit: () => { },
    paginate: () => { },
  }
}



const labTable = cachero.getTable("lab")

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

const getDataLength = (colum) => {
  return `COALESCE(ARRAY_LENGTH(${colum}, 1), 0)`
}

labTable.select("*", { name: "like_count", data: getDataLength("liked_user") }).order(["created_at", "DESC"]).with(withData).paginate(1, 30)
labTable.select("*").search(search).with(withData).paginate(1, 30)
labTable.select("*").equal(["id", "0"]).with(withData).paginate(1, 30)
labTable.select("*").with(withData).limit(30)

labTable.create(data).checkIntegrity(integrity)

labTable.update(data, { id: "0" }).checkIntegrity(integrity)

labTable.delete({ id: "0" })
