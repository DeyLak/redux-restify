import hash from 'object-hash/index' // import from index to suppress webpack prebuild js warning

import { camelToLowerSnake } from 'helpers/namingNotation'


export const NAME = 'api'

export const DEFAULT_API_NAME = 'default'
export const DEFAULT_API_SORT_FIELD = 'sort'

export const DOWNLOADING_URL = 'downloading'
export const UPLOADING_URL = 'uploading'

export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_BACKEND_DATE_FORMAT = 'YYYY-MM-DD'

const convertToValidQueryParam = (key, value, { dateFormat = DEFAULT_BACKEND_DATE_FORMAT }) => {
  let result = ''
  if (value === undefined) return result
  result += `&${key}=`

  // eslint-disable-next-line no-underscore-dangle
  if (typeof value === 'object' && value !== null && value._isAMomentObject) {
    result += value.format(dateFormat)
    return result
  }

  result += value
  return result
}

export const queryFormat = (query, config = {}) => {
  let formatedQuery = ''
  Object.entries(query).forEach(([key, val]) => {
    const snakeKey = camelToLowerSnake(key)
    if (Array.isArray(val)) {
      val.forEach(v => { (formatedQuery += convertToValidQueryParam(snakeKey, v, config)) })
    } else {
      formatedQuery += convertToValidQueryParam(snakeKey, val, config)
    }
  })
  return formatedQuery.slice(1)
}

export const getPagesConfigHash = (filter, sort, parentEntities, specialConfig, pageSize) => {
  return hash({ filter, sort, parentEntities, specialConfig, pageSize })
}

export const getQueryHash = (query) => {
  if (typeof query === 'object' && query !== null && Object.keys(query).length) {
    return `?${hash({
      filter: {},
      parentEntities: {},
      ...query,
    })}`
  }
  if (typeof query === 'string') return query
  return ''
}

export const getSpecialIdWithQuery = (id, query) => {
  if (!query) return id
  return `${id}/?${queryFormat(query)}`
}

export const DEFAULT_MODEL_OBJECT = {
  pageSize: undefined, // Default page size for model, default - undefined, due to fallback for api default page size
  parent: undefined, // Parent entity name, or names array for related entities like /parent-entity/{id}/child-entity
  endpoint: '', // Endpoint for accessing this entity(without parents and api prefixes)
  defaults: {
    id: undefined, // This is Restify unique key field. It always should be presented in the model
  }, // Default values for entity from this endpoint(for components sync loading entities access)
  pagination: true, // Does this entity has pagination for list requests
  // You can specify id field of the model, or calculate some id from the data, using function
  // item => id for cases, when item has no id, or response list has id dublicates
  idField: 'id',
  convertToCamelCase: true, // Should the fields names from back-end be converted to camelCase notation
  removeNulls: true, // Replace null values with undefined
  orderArrays: true, // Sort arrays, if they have order field
  apiName: DEFAULT_API_NAME, // Api name, from registeres apies list
}

export const createModelConfig = (config) => ({
  ...DEFAULT_MODEL_OBJECT,
  ...config,
  defaults: {
    ...DEFAULT_MODEL_OBJECT.defaults,
    ...config.defaults,
  },
})
