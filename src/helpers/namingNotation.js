import sortBy from 'lodash/sortBy'

import { isPureObject } from '~/helpers/def'

const memoFunc = f => {
  const memo = {}
  return s => {
    if (s in memo) {
      return memo[s]
    }
    memo[s] = f(s)
    return memo[s]
  }
}

const camelToSnake = memoFunc(s => s.replace(/([a-z])([A-Z]+)/g, '$1_$2'))
export const camelToLowerSnake = memoFunc(s => camelToSnake(s).toLowerCase())
export const camelToUpperSnake = memoFunc(s => camelToSnake(s).toUpperCase())
// Using camel to snake for exclude camelCase parts from converting to lower case
export const snakeToCamel = memoFunc(s => {
  return camelToSnake(s).toLowerCase().replace(/(.)_+(.)/g, (match, g1, g2) => g1 + g2.toUpperCase())
})

const objectToCase = convertingFunc => (obj, config = {}) => {
  const {
    removeNulls = false,
    orderArrays = false,
    orderField = 'order',
  } = config
  if (!isPureObject(obj)) {
    return obj === null && removeNulls ? undefined : obj
  }

  if (Array.isArray(obj)) {
    let convertingArray = obj
    if (orderArrays) {
      convertingArray = sortBy(convertingArray, (item) => {
        if (item && typeof item === 'object') return item[orderField]
        return ''
      })
    }
    return convertingArray.map(item => objectToCase(convertingFunc)(item, config))
  }
  return Object.keys(obj || []).reduce((memo, key) => {
    const currentObj = obj[key]
    const currentKey = convertingFunc(key)
    // eslint-disable-next-line no-param-reassign
    memo[currentKey] = objectToCase(convertingFunc)(currentObj, config)
    return memo
  }, {})
}

export const objectToCamel = objectToCase(snakeToCamel)
export const objectToLowerSnake = objectToCase(camelToLowerSnake)
export const objectToUpperSnake = objectToCase(camelToUpperSnake)
