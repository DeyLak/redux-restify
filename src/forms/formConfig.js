import merge from 'lodash/merge'
import uuidV4 from 'uuid/v4'

import { RESTIFY_CONFIG } from '../config'


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
  resetOnSubmit: false, // Form can be reseted after submitting, for reuse
  deleteOnSubmit: false, // If the form is temporary, it can be deleted after success submitting
  convertToSnakeCaseBeforeSend: true, // All fields in form are converted to lower_snake_case before submit
  convertResultToCamelCase: true, // Should back-end result be converted to camelCase
  resultRemoveNulls: true, // Should nulls be replaced with undefineds in result
  resultOrderArrays: true, // Should arrays be ordered by order filed
  // Action object, action type or callback, dispatched on successfull submit. Warning, that callbacks only can be use
  // with static form type, or in nested configs, cause of dynamic forms are serialized into redux store
  onSuccess: undefined,
  // Fields that can by synced with query params.
  // If value id false - field just syncs, if true, query will reset all other fields even uset one's.
  // Usefull for id's
  // TODO by @deylak not implemented
  syncWithRouter: {},
  // Form validation definition.
  // Can be object with keys with same path, as in forms,
  // preset, or function of (currentLevelValue, formValues) => bool.
  // Of object is used, every node is following the same rules, as top-level preset or function
  validate: undefined,
  validateOnFieldChange: true, // Should form be validated after every field change
  validateOnSubmit: true, // Should form be validated before submitting
  allowSendInvalid: false, // Allow to send form with errors to server
}

export const getComposedConfig = (config) => {
  if (typeof config === 'string') {
    return RESTIFY_CONFIG.registeredForms[config]
  }
  if (config.baseConfig) {
    return merge({}, RESTIFY_CONFIG.registeredForms[config.baseConfig], config)
  }
  return config
}

export const removeArrayDefaults = (config) => {
  const composedConfig = getComposedConfig(config)
  return Object.keys(composedConfig).reduce((memo, key) => ({
    ...memo,
    [key]: Array.isArray(composedConfig[key]) ? [] : composedConfig[key],
  }), {})
}

export const getDefaultFormObject = (config) => {
  const composedConfig = getComposedConfig(config)
  return {
    ...removeArrayDefaults(composedConfig.defaults),
    ...composedConfig.values,
    $errors: {},
    $edit: {},
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
