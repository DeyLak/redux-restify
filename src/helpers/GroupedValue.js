import { mutateObject } from '~/helpers/nestedObjects'


const round = (value, roundCount = 2) => {
  const tenPow = 10 ** roundCount
  return Math.round(value * tenPow) / tenPow
}
// Class for calculating averages
// sum - sum of values
// count of summed values
// Number of digits after comma when rounding in toString() method
// if initialized with count === -1, then it doesn't group sum value, but can be useful for abstraction
// if initialized with count === -2, changes toString behaviour, returns '-' if nothing was added to group
// usefull for grouping null scores
class GroupedValue {
  constructor(sum = 0, count = 0, roundCount = 0) {
    this.sum = sum
    this.count = count || (sum === 0 ? 0 : 1)
    this.roundCount = roundCount
    Object.defineProperty(this, 'res', {
      get: () => {
        if (this.count === -1) return this.sum
        this.value = (this.sum / this.count) || 0
        return this.value
      },
      enumerable: false,
    })
  }

  clone() {
    return new GroupedValue(this.sum, this.count)
  }

  toString() {
    if (this.count === -2) {
      return '-'
    }
    return round(this.res, this.roundCount)
  }

  // Adds values to average calculations
  // sum - sum of values
  // count - count of summed values
  addToGrouped(sum, count = 1) {
    if (!(sum instanceof GroupedValue) && typeof sum !== 'number') return this

    let addingSum
    let addingCount
    if (typeof sum === 'number') {
      addingSum = sum
      addingCount = count
      if (this.count === -1) {
        this.sum += addingSum
        return this
      }
    }
    if (this.count === -2) {
      this.count = 0
    }
    if (sum instanceof GroupedValue) {
      addingSum = sum.sum
      addingCount = sum.count > 0 ? sum.count : 0
    }
    this.sum += addingSum
    if (sum.count === -1) {
      this.count = -1
    } else {
      this.count += addingCount
    }

    return this
  }
}

export default GroupedValue


// Same as Object.assign, but groups grouped values properly
export const assignAndGroup = (obj1, obj2) => {
  const result = { ...obj1 }
  Object.keys(obj2).forEach(key => {
    const currentObject = obj2[key]
    if (currentObject instanceof GroupedValue) {
      if (result[key] === undefined) {
        result[key] = new GroupedValue(0, -2)
      }
      result[key].addToGrouped(currentObject)
    } else if (typeof currentObject === 'object' && currentObject !== null) {
      if (result[key] === undefined) {
        result[key] = {}
      }
      result[key] = assignAndGroup(result[key], currentObject)
    } else {
      result[key] = currentObject
    }
  })
  return result
}

// Groups array of objects, same as assignAndGroup
// Transform functions helps to get rid of unnecessary fields or define, wich of them to group
export const groupObjects = (array, transformFunc = o => o) => {
  return array.reduce((memo, item) => {
    return assignAndGroup(memo, transformFunc(item))
  }, {})
}

// Replaces grouped values in object with their string representation, usefull for rendering
export const flushGroupedValues = mutateObject(
  (key, value) => value instanceof GroupedValue,
  value => value.toString(),
)
