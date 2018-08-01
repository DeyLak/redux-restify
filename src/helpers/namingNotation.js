import sortBy from 'lodash/sortBy'

import { isPureObject } from 'helpers/def'


const camelToSnake = s => s.replace(/([a-z])([A-Z]+)/g, '$1_$2')
export const camelToLowerSnake = s => camelToSnake(s).toLowerCase()
export const camelToUpperSnake = s => camelToSnake(s).toUpperCase()
// Using camel to snake for exclude camelCase parts from converting to lower case
export const snakeToCamel = s => {
  return camelToSnake(s).toLowerCase().replace(/(.)_+(.)/g, (match, g1, g2) => g1 + g2.toUpperCase())
}

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
        if (typeof item === 'object') return item[orderField]
        return ''
      })
    }
    return convertingArray.map(item => objectToCase(convertingFunc)(item, config))
  }
  return Object.keys(obj || []).reduce((memo, key) => {
    const currentObj = obj[key]
    const currentKey = convertingFunc(key)
    return {
      ...memo,
      [currentKey]: objectToCase(convertingFunc)(currentObj, config),
    }
  }, {})
}

export const objectToCamel = objectToCase(snakeToCamel)
export const objectToLowerSnake = objectToCase(camelToLowerSnake)
export const objectToUpperSnake = objectToCase(camelToUpperSnake)
