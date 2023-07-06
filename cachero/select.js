
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

export const select = async ({ redis, table, data, count, cachedKey, deleted, pool, tableColumns }, selectData, key) => {
  selectData.column.forEach((column) => {
    if (column.includes(".*") && !column.includes(table)) {
      throw Error(`You can't send column like this: anotherTable.*`);
    }
  })

  if (!(cachedKey.includes(key) || data.length === count)) {
    const where = selectData.where ? selectData.where.result.map((condition) => {
      const [key, operator, value] = selectData.where[condition]
      if (result === "&&" || result === "||") return result
      else if (operator !== "IN" || operator !== "NOT IN") return selectData.where[condition].join(" ")
      else if (Array.isArray(value)) return key + operator + `(${value.join(',')})`
    }).join(" ") : ""
    const join = selectData.join ? "JOIN " + selectData.join : ""
    const columnList = selectData.column.join(", ") ?? `${table}.*`
    const order = selectData.order ? "ORDER BY " + selectData.order.join(", ") : ""
    const limit = selectData.limit ? "LIMIT " + selectData.limit : ""
    const offset = selectData.offset ? "OFFSET " + selectData.offset : ""
    const result = await pool.query(`
      SELECT ${columnList}
      FROM ${table}
      ${join}
      ${where}
      ${order}
      ${limit} ${offset};
    `);

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

  const columnList = []
  if ("column" in selectData) {

    if (selectData.column.indexOf("*") < 0) {
      selectData.column.forEach((column) => {
        const dotResult = column.match(/\.(\w+)/);
        const isIncludeNotTableName = column.includes(".*") && !column.includes(table);
        const isIncludeAS = column.includes(" AS ") ? " AS " : null || column.includes(" as ") ? " as " : null
        let resultColumn = column;
        if (isIncludeAS) {
          resultColumn = column.split(isIncludeAS)[1]
        } else if (column === `${table}.*`) {
          return columnList.push(...tableColumns)
        } else if (isIncludeNotTableName) {
          throw Error(`You can't send column like this: anotherTable.*`);
        } else if (dotResult && dotResult.length > 1) {
          resultColumn = dotResult[1]
        }
        if (columnList.includes(resultColumn)) throw Error("Wrong Column Selected");
        return columnList.push(resultColumn)
      })

      resultData = resultData.map((obj) => {
        const filteredObj = {};
        columnList.forEach((key) => {
          if (obj.hasOwnProperty(key)) {
            filteredObj[key] = obj[key];
          }
        });
        return filteredObj;
      });
    }
  }

  function orderData(order, key) {
    resultData = resultData.sort((a, b) => {
      const x = a[key];
      const y = b[key];

      if (typeof x === 'number' && typeof y === 'number') {
        if (order === "DESC") return y - x;
        else return x - y;
      } else if (isDateString(x) && isDateString(y)) {
        // @ts-ignore
        if (order === "DESC") return new Date(y) - new Date(x);
        // @ts-ignore
        else return new Date(x) - new Date(y);
      }
      else {
        if (order === "DESC") {
          if (x > y) return -1;
          else if (x < y) return 1;
          else return 0;
        } else {
          if (x < y) return -1;
          else if (x > y) return 1;
          else return 0;
        }
      }
    });
  }
  if ("order" in selectData) {
    selectData.order.forEach((key) => {
      const order = key.split(" ")
      if (order.length === 2) {
        if (order[1] === "DESC") orderData("DESC", order[0])
        else orderData("ASC", order[0])
      } else if (order.length === 1) {
        orderData("ASC", order[0])
      } else {
        throw Error("Invalid structure of order")
      }
    })
  }

  if ("where" in selectData) {
    // Object.keys(selectData.where).forEach((key) => {
    //   if (!columnList.includes(selectData.where[key][0]) && key !== "result") {
    //     throw Error("You must bring the column, which is the condition of the where clause, as an element");
    //   }
    // })
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
      throw Error("Result contains undefined conditions")
    }).join(" ")
    return eval(resultCon)
  })
}