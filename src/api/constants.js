import hash from 'object-hash/index' // import from index to suppress webpack prebuild js warning

import { camelToLowerSnake } from '~/helpers/namingNotation'


export const NAME = 'api'

export const DEFAULT_USE_SNAKE_CASE = true

export const DEFAULT_API_NAME = 'default'
export const DEFAULT_API_SORT_FIELD = 'sort'

export const DOWNLOADING_URL = 'downloading'
export const UPLOADING_URL = 'uploading'

export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE_NUMBER = 1
export const DEFAULT_BACKEND_DATE_FORMAT = 'YYYY-MM-DD'

const convertToValidQueryParam = (key, value, { dateFormat = DEFAULT_BACKEND_DATE_FORMAT }) => {
  let result = ''
  if (value === undefined) return result
  result += `&${key}=`

  // eslint-disable-next-line no-underscore-dangle
  if (typeof value === 'object' && value !== null && value._isAMomentObject) {
    result += encodeURIComponent(value.format(dateFormat))
    return result
  }

  result += value
  return result
}

export const queryFormat = (query, config = {}) => {
  let formatedQuery = ''
  Object.entries(query).forEach(([key, val]) => {
    const snakeKey = config.useSnakeCase ? camelToLowerSnake(key) : key
    if (Array.isArray(val)) {
      val.forEach(v => { (formatedQuery += convertToValidQueryParam(snakeKey, v, config)) })
    } else {
      formatedQuery += convertToValidQueryParam(snakeKey, val, config)
    }
  })
  return formatedQuery.slice(1)
}

export const getPagesConfigHash = (filter, sort, parentEntities, specialConfig, argPageSize, modelConfig) => {
  let pageSize = argPageSize
  if (modelConfig && modelConfig.pageSize) {
    pageSize = undefined
  }
  return hash({ filter, sort, parentEntities, specialConfig, pageSize, modelConfig })
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

export const getSpecialIdWithQuery = (id, query, parentEntities) => {
  if (!query) return id
  let parentEntitiesAddition = ''
  if (parentEntities) {
    parentEntitiesAddition = `/${hash(parentEntities)}`
  }

  return `${id}/?${queryFormat(query)}${parentEntitiesAddition}`
}

export const getCacheValidationHashForId = (id, asyncGetters) => {
  return hash({ id, asyncGetters })
}

export const CRUD_ACTION_CREATE = 'create'
export const CRUD_ACTION_UPDATE = 'update'
export const CRUD_ACTION_DELETE = 'delete'
export const CRUD_ACTION_READ = 'read'

export const CRUD_ACTIONS = {
  [CRUD_ACTION_CREATE]: CRUD_ACTION_CREATE,
  [CRUD_ACTION_UPDATE]: CRUD_ACTION_UPDATE,
  [CRUD_ACTION_DELETE]: CRUD_ACTION_DELETE,
  [CRUD_ACTION_READ]: CRUD_ACTION_READ,
}
