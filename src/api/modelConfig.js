import RestifyArray from './models/RestifyArray'
import RestifyForeignKeysArray from './models/RestifyForeignKeysArray'

import { DEFAULT_API_NAME } from './constants'


export const DEFAULT_MODEL_OBJECT = {
  pageSize: undefined, // Default page size for model, default - undefined, due to fallback for api default page size
  parent: undefined, // Parent entity name, or names array for related entities like /parent-entity/{id}/child-entity
  endpoint: '', // Endpoint for accessing this entity(without parents and api prefixes)
  // You can disable attempts to load entity by id, if you don't have an endpoint for it
  // and use it only for inner model structure, or load entitis only via list request
  allowIdRequests: true,
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
  // By default, only pages are being cleared on route changes, so requests will be repeated, to get fresh data
  // But sometimes, we want the entire data to be cleared and re-requested.
  clearDataOnRouteChange: false,
  apiName: DEFAULT_API_NAME, // Api name, from registeres apies list
  transformArrayResponse: undefined, // Same, as in api config, but for one model
  getEntityUrl: undefined, // Same, as in api config, but for one model
}

const createModelConfig = (config) => {
  const currentDefaults = {
    ...DEFAULT_MODEL_OBJECT.defaults,
    ...config.defaults,
  }
  const foreignKeysDefaults = Object.keys(config.defaults).reduce((memo, key) => {
    if (config.defaults[key] instanceof RestifyForeignKeysArray || config.defaults[key] instanceof RestifyArray) {
      let newKey = key
      if (config.defaults[key] instanceof RestifyForeignKeysArray) {
        newKey = config.defaults[key].getIdField(key)
      }
      return {
        ...memo,
        [newKey]: [],
      }
    }
    return memo
  }, {})
  return {
    ...DEFAULT_MODEL_OBJECT,
    ...config,
    defaults: {
      ...foreignKeysDefaults,
      ...currentDefaults,
    },
  }
}

export default createModelConfig
