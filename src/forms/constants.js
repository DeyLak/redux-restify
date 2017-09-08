import {
  DEFAULT_FIELD_FUNCTIONS,
  DEFAULT_FIELD_FUNCTIONS_VALUES,
} from './formConfig'
import { makeActionsBundle } from 'helpers/actions'
import { isDefAndNotNull, isPureObject } from 'helpers/def'
import { RESTIFY_CONFIG } from '../config'
import { onRegisterForm } from '../init'


export const NAME = 'forms'

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
    return (new Array(obj[ARRAY_CONFIG_INDEX].count || 0)).fill(getDefaultObject(obj[ARRAY_DEFAULTS_INDEX]))
  }
  if (typeof obj === 'object') {
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

const actionsTypesForms = [
  'CHANGE_FIELD',
  'RESET_FIELD',
  'SET_ERRORS',
  'SET_IS_VALID',
  'REMEMBER_FIELD_STATE',
  'SAVE_EDITING_FIELD',
]

const actionsTypesGeneralForms = actionsTypesForms.concat([
  'CREATE_FORM',
  'DELETE_FORM',
  'RESET_FORM',
  'RENAME_FORM',
])

export const GENERAL_FORMS_ACTIONS = '$general'
export const ACTIONS_TYPES = {
  [GENERAL_FORMS_ACTIONS]: makeActionsBundle(NAME, GENERAL_FORMS_ACTIONS, actionsTypesGeneralForms),
}
onRegisterForm(() => {
  RESTIFY_CONFIG.formsTypes.forEach((formType) => {
    ACTIONS_TYPES[formType] = makeActionsBundle(NAME, formType, actionsTypesForms)
  })
})

export const getActionType = formType => ACTIONS_TYPES[formType] || ACTIONS_TYPES[GENERAL_FORMS_ACTIONS]

export { DEFAULT_FIELD_FUNCTIONS } from './formConfig'
