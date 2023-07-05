
function isDateString(inputString) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timestampPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  const timestampWithTimeZonePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/;
  const dateTest = datePattern.test(inputString)
  const timestampTest = timestampPattern.test(inputString)
  const timestampWithTimeZone = timestampWithTimeZonePattern.test(inputString)
  if (dateTest || timestampTest || timestampWithTimeZone) return true
  return false
}

export const select = async ({ redis, table, data, count, cachedKey, deleted }, pool, selectData, props, key) => {
  if (!cachedKey.includes(key) || data.length !== count) {
    const where = selectData.where.result.map((condition) => {
      const [key, operator, value] = selectData.where[condition]
      if (result === "&&" || result === "||") return result
      else if (operator !== "IN" || operator !== "NOT IN") return selectData.where[condition].join(" ")
      else if (Array.isArray(value)) return key + operator + `(${value.join(',')})`
    }).join(" ")
    const join = selectData.join ? "JOIN " + selectData.join : ""
    const column = selectData.column ?? `${table}.*`
    const order = selectData.order ? "ORDER BY " + selectData.order.join(", ") : ""
    const limit = selectData.limit ? "LIMIT " + selectData.limit : ""
    const offset = selectData.offset ? "OFFSET " + selectData.offset : ""
    const result = await pool.query(`
      SELECT ${column}
      FROM ${table}
      ${join}
      ${where}
      ${order}
      ${limit} ${offset};
    `, props);

    deleted.forEach(({ key, value }) => {
      result.rows.forEach((resultData, index) => {
        if (resultData[key] === value) delete result.rows[index]
      })
    })

    cachedKey.push(key)
    const selectResult = JSON.parse(JSON.stringify(result.rows))
    selectResult.forEach(newObj => {
      const existingObjIndex = data.findIndex(obj => obj.id === newObj.id);
      if (existingObjIndex !== -1) {
        data[existingObjIndex] = { ...data[existingObjIndex], ...newObj }; // 이미 있는 오브젝트를 덮어씌우면서 새로운 키를 추가
      } else {
        data.push(newObj); // 새로운 오브젝트를 추가
      }
    });
    if (redis) redis.set(table, JSON.stringify(data))
    return result.rows
  }

  let resultData = data;

  let column
  if ("column" in selectData) {
    const columns = selectData.column.split(/,\s*/);
    column = columns.map((column) => {
      const dotPattern = /\.(\w+)/;
      const asPattern = /AS\s(.+)/;
      const dotResult = column.match(dotPattern);
      const asResult = column.match(asPattern);
      if (dotResult && dotResult.length > 1) return dotResult
      else if (asResult && asResult.length > 1) return asResult
    })

    resultData = resultData.map(function (obj) {
      const filteredObj = {};
      columns.forEach(function (key) {
        if (obj.hasOwnProperty(key)) {
          filteredObj[key] = obj[key];
        }
      });
      return filteredObj;
    });
  }

  if ("order" in selectData) {
    resultData = selectData.sort((a, b) => {
      const x = a[key].toLowerCase();;
      const y = b[key].toLowerCase();;

      if (typeof x === 'number' && typeof y === 'number') return x - y;
      else if (isDateString(x) && isDateString(y)) {
        // @ts-ignore
        return new Date(x) - new Date(y);
      }
      else if (typeof x === 'string' && typeof y === 'string') {
        if (x < y) return -1;
        else if (x > y) return 1;
      }
      return 0;
    });
  }

  if ("where" in selectData) {
    Object.keys(selectData.where).forEach((key) => {
      if (!column.includes(selectData.where[key][0]) && key !== "result") {
        throw "You must bring the column, which is the condition of the where clause, as an element";
      }
    })
    resultData = filterData(resultData, selectData.where)
  }

  if ("offset" in selectData) resultData = resultData.slice(selectData.offset)

  if ("limit" in selectData) resultData = resultData.slice(0, selectData.limit)

  return resultData
}

// labTable.select({
//   column: "",
//   order: ["created_at DESC"],
//   join: "users ON lab.maker_id = users.id",
//   limit: 30,
//   offset: 0,
//   where: {
//     condition2: ["column1", ">", "$1"],
//     condition3: ["column1", "IN", ["1", "2"]],
//     result: ["condition1", "&&", "condition2", "||", "condition3"]
//   },
// })


function evaluateCondition(condition, item) {
  const [key, operator, value] = condition;
  function checkLikeData() {
    const checkEndData = item[key][0] === "%";
    const checkStartData = item[key][item[key].length - 1] === "%";
    const onlyValue = value.replace(/\%/g, '');
    const isEndsWith = item[key].endsWith(onlyValue)
    const isStartsWith = item[key].startsWith(onlyValue)

    if (checkEndData && !checkStartData) return isEndsWith
    else if (!checkEndData && checkStartData) return isStartsWith
    else return isEndsWith && isStartsWith
  }
  switch (operator) {
    case '=':
      return item[key] == value;
    case '==':
      return item[key] == value;
    case '!=':
      return item[key] != value;
    case '<>':
      return item[key] != value;
    case '>':
      return item[key] > value;
    case '<':
      return item[key] < value;
    case '>=':
      return item[key] >= value;
    case '<=':
      return item[key] <= value;
    case 'IN':
      return value.includes(item[key]);
    case 'NOT IN':
      return !value.includes(item[key]);
    case 'ILIKE':
      return checkLikeData()
    case 'LIKE':
      return checkLikeData()
    default:
      return true;
  }
}

function filterData(data, conditions) {
  return data.filter((filterData) => {
    const totalCondition = {}
    Object.keys(conditions).forEach((key) => {
      if (key === "result") return;
      totalCondition[key] = evaluateCondition(conditions[key], filterData)
    })
    const resultCon = conditions.result.map((result) => {
      if (result === "&&" || result === "||") return result
      else if (result in totalCondition) return String(totalCondition[result])
      throw "Result contains undefined conditions"
    }).join(" ")
    return eval(resultCon)
  })
}