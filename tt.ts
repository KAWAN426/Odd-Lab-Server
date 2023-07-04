interface Condition {
  [key: string]: string | number | string[];
}

interface Conditions {
  [key: string]: Condition | string[];
}

interface Data {
  [key: string]: string | number;
}

const data: Data[] = [
  { column1: 1, column2: 'A' },
  { column1: 2, column2: 'B' },
  { column1: 3, column2: 'C' },
];

function evaluateCondition(condition: Condition, item: Data): boolean {
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

function filterData(array: Data[], conditions: Conditions): Data[] {
  const resultCondition = conditions.result;
  return array.filter((item) => {
    return resultCondition.reduce((accumulator, condition, index) => {
      if (index === 0) {
        return evaluateCondition(condition, item);
      }

      const logicalOperator = condition as string;
      const nextCondition = conditions[`condition${index + 1}`] as Condition;

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
