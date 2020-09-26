import { RESTIFY_CONFIG } from '../config'
import { onRegisterForm } from '../init'
import { ValidationPreset } from './validation'

import { makeActionsBundle } from '~/helpers/actions'
import { isPureObject } from '~/helpers/def'
import { getRecursiveObjectReplacement } from '~/helpers/nestedObjects'


export const NAME = 'forms'

const actionsTypesForms = [
  'CHANGE_FIELD',
  'CHANGE_SOME_FIELDS',
  'RESET_FIELD',
  'SET_ERRORS',
  'SET_IS_VALID',
  'REMEMBER_FIELD_STATE',
  'SAVE_EDITING_FIELD',
  'SET_DIRTY_STATE',
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

export const calculateValidationResult = (values, validationConfig, deperecatedGetState) => {
  let validationResult = {}
  const addToValidationResult = (value, field) => {
    let fieldKey = field
    if (!fieldKey.length && !isPureObject(value)) {
      fieldKey = '$global'
    }
    validationResult = getRecursiveObjectReplacement(validationResult, fieldKey, value)
  }
  const calucalateCurrentLevelValidate = (currentLevelValues, validationField, currentPath = []) => {
    if (validationField instanceof ValidationPreset) {
      addToValidationResult(validationField.validate(currentLevelValues, values), currentPath)
    } else if (typeof validationField === 'function') {
      addToValidationResult(validationField(currentLevelValues, values, deperecatedGetState), currentPath)
    } else if (validationField !== null && typeof validationField === 'object') {
      Object.keys(validationField).forEach(key => {
        addToValidationResult(calucalateCurrentLevelValidate(
          currentLevelValues && currentLevelValues[key],
          validationField[key],
          currentPath.concat(key),
        ), currentPath)
      })
    }
  }
  calucalateCurrentLevelValidate(values, validationConfig)
  return validationResult
}

export { DEFAULT_FIELD_FUNCTIONS } from './formConfig'
