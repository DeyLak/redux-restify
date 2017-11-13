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
