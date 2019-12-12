import uuidV4 from 'uuid/v4'

import { RESTIFY_CONFIG } from '../config'
import { mergeAndReplaceArrays } from '~/helpers/nestedObjects'
import { isDefAndNotNull, isPureObject } from '~/helpers/def'


const UUID_FUNC = '$uuid'

export const DEFAULT_FIELD_FUNCTIONS = {
  [UUID_FUNC]: UUID_FUNC,
}

export const DEFAULT_FIELD_FUNCTIONS_VALUES = {
  [UUID_FUNC]: uuidV4,
}

export const DEFAULT_FORM_OBJECT = {
  baseConfig: undefined, // Name of other registered config, on wich newly created form is based
  apiName: undefined, // Api name, wich should be used to send this form
  endpoint: '', // Endpoint to submit to server, can be either string, or function (formValues) => string
  // If set, endpoint field is ignored, links form to api model, updates data according to RESTfull protocol
  model: '',
  useOptimisticUpdate: true, // Should optimistic update occure
  updateEntity: true, // Sholud entity by id be updated, when submitting RESTfull form
  // Entity id, which is used in RESTfull requests, like entities/{id}
  // Field is optional, also id field from data passed is used by default
  id: undefined,
  specialAction: '', // Postfix for model url, for some special-endpoints, like: entity/{id}/{action}
  method: undefined, // Method to submit form, usually not necessary, cause RESTfull endpoints can self-define methods
  onRouteChangeReset: {}, // Fields to be reset on route change event
  onRefreshReset: {}, // Fields to be reset on react store init
  defaults: {}, // Form fields and their default values
  values: {}, // Form initial values, if some key is not provided - default value is used
  // Form fields, that shoudn't be submitted to server, ex: { myField: true }
  // Can also be a function from (key, formValues, keyParentPath) => bool, where keyParentPath - is array of keys
  submitExclude: {},
  // Performs form data transformation before sending it to server
  // Object with form keys, that should be transformed (key, value, formValues) => newValue
  transformBeforeSubmit: {},
  resetOnSubmit: false, // Form can be reseted after submitting, for reuse
  deleteOnSubmit: false, // If the form is temporary, it can be deleted after success submitting
  convertToSnakeCaseBeforeSend: undefined, // All fields in form are converted to lower_snake_case before submit
  convertResultToCamelCase: true, // Should back-end result be converted to camelCase
  resultRemoveNulls: true, // Should nulls be replaced with undefineds in result
  resultOrderArrays: true, // Should arrays be ordered by order filed
  // Action object, action type or callback, dispatched on successfull submit. Warning, that callbacks only can be use
  // with static form type, or in nested configs, cause of dynamic forms are serialized into redux store
  // @deprecated use Promises instead
  onSuccess: undefined,
  // Fields that can by synced with query params.
  // If value id false - field just syncs, if true, query will reset all other fields even uset one's.
  // Usefull for id's
  // TODO by @deylak not implemented
  syncWithRouter: {},
  // Form validation definition.
  // Can be object with keys with same path, as in forms,
  // preset, or function of (currentLevelValue, formValues) => bool.
  // If object is used, every node is following the same rules, as top-level preset or function
  validate: undefined,
  validateOnFieldChange: true, // Should form be validated after every field change
  validateAll: false, // Should all registered form fields be validated, despite their presense in form values
  validateOnSubmit: true, // Should form be validated before submitting
  allowSendInvalid: false, // Allow to send form with errors to server
  mapServerDataToIds: false, // When mapping server data to form, it maps foreign keys to ids
  trackDirtyFields: false, // Auto-set dirty state for fields, that are changed
  submitOnlyDirtyFields: false, // Exclude not marked as dirty fields from form submission
  // Passed to model getEntityUrl function and used for defining some urls
  // Can be detected automatically between create and update, based on id field
  crudAction: undefined,
  // Query params for request
  query: undefined,
  apiConfig: {}, // Overriding fields from api config
}

export const getFormObjectConfig = (formType, name, config) => {
  let currentConfig = config && config.defaults
  if (!currentConfig) {
    currentConfig = RESTIFY_CONFIG.registeredForms[formType] && RESTIFY_CONFIG.registeredForms[formType].defaults
  }
  if (!currentConfig) return undefined
  let result
  if (typeof name === 'string') {
    result = currentConfig[name]
  } else {
    // Getting nested object field, but don't use helper, cause of special condition for indecies
    result = name.reduce((memo, item) => {
      return memo ? memo[typeof item === 'string' ? item : 0] : undefined
    }, currentConfig)
  }
  return result
}

// Contract-base array-config indecies
// Arrays in form defaults config can contain 2 elements:
// 1. Defaults for new array element(same rules, as other objects defaults)
// 2. Config for array itself, can contain theese fiels:
//    * orderable - adds each array item an order property, wich equals to element index in array,
//      useful for independance from server array sorting
//    * fakeId - for new array instances generates an uuid in id field, but do not submit it to server
//    * count - deault count of items, added to array, when initializing default from object
export const ARRAY_DEFAULTS_INDEX = 0
export const ARRAY_CONFIG_INDEX = 1

export const getDefaultObject = (obj) => {
  if (!isDefAndNotNull(obj)) return obj
  if (DEFAULT_FIELD_FUNCTIONS[obj]) return DEFAULT_FIELD_FUNCTIONS_VALUES[obj]()
  if (Array.isArray(obj)) {
    if (obj[ARRAY_CONFIG_INDEX] === undefined) return []
    const array = (new Array(obj[ARRAY_CONFIG_INDEX].count || 0)).fill(getDefaultObject(obj[ARRAY_DEFAULTS_INDEX]))
    return array.map((item, index) => {
      const newItem = { ...item }
      if (obj[ARRAY_CONFIG_INDEX].fakeId) {
        newItem.id = uuidV4()
      }
      if (obj[ARRAY_CONFIG_INDEX].orderable) {
        newItem[RESTIFY_CONFIG.options.orderableFormFieldName] = index
      }
      return newItem
    })
  }
  if (isPureObject(obj)) {
    return Object.keys(obj).reduce((memo, key) => ({
      ...memo,
      [key]: getDefaultObject(obj[key]),
    }), {})
  }

  return obj
}

export const getFormArrayConfig = (...args) => {
  const config = getFormObjectConfig(...args)
  if (Array.isArray(config)) {
    return config[ARRAY_CONFIG_INDEX] || {}
  }
  return {}
}

export const getFormDefaultValue = (...args) => getDefaultObject(getFormObjectConfig(...args))

export const updateDefaultValue = (defaultValue, value) => {
  if (isPureObject(value)) {
    return {
      ...defaultValue,
      ...value,
    }
  }
  if (typeof value === 'undefined') return defaultValue
  return value
}

export const getComposedConfig = (config) => {
  if (!config) {
    return { ...DEFAULT_FORM_OBJECT }
  }
  if (typeof config === 'string') {
    return RESTIFY_CONFIG.registeredForms[config]
  }
  if (config.baseConfig) {
    return mergeAndReplaceArrays({}, RESTIFY_CONFIG.registeredForms[config.baseConfig], config)
  }
  return config
}

export const removeArrayDefaults = (config) => {
  const composedConfig = getComposedConfig(config)
  return Object.keys(composedConfig).reduce((memo, key) => ({
    ...memo,
    [key]: getDefaultObject(composedConfig[key]),
  }), {})
}

export const getDefaultFormObject = (config) => {
  const composedConfig = getComposedConfig(config)
  return {
    ...removeArrayDefaults(composedConfig.defaults),
    ...composedConfig.values,
    $errors: {},
    $edit: {},
    $dirty: {},
  }
}

const createFormConfig = (config) => {
  const composedConfig = getComposedConfig(config)
  return {
    ...DEFAULT_FORM_OBJECT,
    ...composedConfig,
  }
}

export default createFormConfig
