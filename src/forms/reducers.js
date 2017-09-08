import unset from 'lodash/unset'

import {
  ACTIONS_TYPES,
  GENERAL_FORMS_ACTIONS,
  getFormDefaultValue,
} from './constants'
import { getDefaultFormObject } from './formConfig'
import { ROUTER_LOCATION_CHANGE_ACTION, INIT_ACTION } from 'constants'
import { getRecursiveObjectReplacement, removeUndefinedKeys } from 'helpers/nestedObjects'

import { RESTIFY_CONFIG } from '../config'


export const init = {
  $configs: {},
}

const getRestifyFormReducer = () => {
  const formsObjects = RESTIFY_CONFIG.registeredForms

  const formDefaultValues = Object.keys(formsObjects).reduce((memo, key) => ({
    ...memo,
    [key]: getDefaultFormObject(formsObjects[key]),
  }), {})

  // Pre-registered forms
  const formsReducers = RESTIFY_CONFIG.formsTypes.reduce((memo, formType) => ({
    ...memo,
    [formType]: (state = formDefaultValues[formType], action) => {
      switch (action.type) {
        case ACTIONS_TYPES[formType].changeField:
          return getRecursiveObjectReplacement(state, action.name, action.value)
        case ACTIONS_TYPES[formType].resetField:
          return getRecursiveObjectReplacement(state, action.name, getFormDefaultValue(formType, action.name))
        case ACTIONS_TYPES[formType].setErrors:
          return {
            ...state,
            $errors: action.value,
          }
        case ACTIONS_TYPES[formType].rememberFieldState:
          return {
            ...state,
            $edit: getRecursiveObjectReplacement(state.$edit, action.name, action.value),
          }
        case ACTIONS_TYPES[formType].saveEditingField: {
          const newEdit = { ...state.$edit }
          unset(newEdit, action.name)
          return {
            ...state,
            $edit: newEdit,
          }
        }
        case ROUTER_LOCATION_CHANGE_ACTION:
          if (action.payload.action === 'REPLACE') return state
          return {
            ...state,
            // Reduce form's route change fields, to reset them
            ...Object.keys(formsObjects[formType].onRouteChangeReset || {}).reduce((currentObject, key) => ({
              ...currentObject,
              [key]: getFormDefaultValue(formType, key),
            }), {}),
            $errors: {},
          }
        case INIT_ACTION:
          return {
            ...state,
            // Reduce form's init change fields, to reset them
            ...Object.keys(formsObjects[formType].onRefreshReset || {}).reduce((currentObject, key) => ({
              ...currentObject,
              [key]: getFormDefaultValue(formType, key),
            }), {}),
            $errors: {},
          }
        default:
          return state
      }
    },
  }), {})

  // Final reducer, includes combined reducers for pre-registered forms and general for runtime-created
  const generalReducer = (state = init, action) => {
    // It is like combine reducers, but we do it manually, to prevent ignoring init generalReducer keys, when triyng to
    // use reduceReducers on combined result
    const nextState = {
      ...state,
      ...RESTIFY_CONFIG.formsTypes.reduce((memo, formType) => ({
        ...memo,
        [formType]: formsReducers[formType](state[formType], action),
      }), {}),
    }
    switch (action.type) {
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].createForm:
        if (process.env.DEV) {
          if (nextState[action.formType] !== undefined) {
            throw new Error(`Attempted to create form with name ${action.formType}, which is already exists!`)
          }
        }
        return {
          ...nextState,
          $configs: {
            ...nextState.$configs,
            [action.formType]: action.config,
          },
          [action.formType]: getDefaultFormObject(action.config),
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].deleteForm:
        return removeUndefinedKeys({
          ...nextState,
          $configs: removeUndefinedKeys({
            ...nextState.$configs,
            [action.formType]: undefined,
          }),
          [action.formType]: undefined,
        })
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].renameForm: {
        if (process.env.DEV) {
          if (nextState[action.formName] !== undefined) {
            throw new Error(`
              Attempted to rename form with name ${action.formType}, to ${action.formName}.
              This name is already exists!
            `.trim())
          }
        }
        return removeUndefinedKeys({
          ...nextState,
          $configs: removeUndefinedKeys({
            ...nextState.$configs,
            [action.formType]: undefined,
            [action.formName]: nextState.$configs[action.formType],
          }),
          [action.formType]: undefined,
          [action.formName]: nextState[action.formType],
        })
      }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].resetForm:
        if (!nextState[action.formType]) return nextState
        return {
          ...nextState,
          [action.formType]: getDefaultFormObject(nextState.$configs[action.formType] || formsObjects[action.formType]),
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].changeField:
        if (!nextState[action.formType]) return nextState
        return {
          ...nextState,
          [action.formType]: getRecursiveObjectReplacement(nextState[action.formType], action.name, action.value),
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].resetField:
        if (!nextState[action.formType]) return nextState
        return {
          ...nextState,
          [action.formType]: getRecursiveObjectReplacement(
            nextState[action.formType],
            action.name,
            getFormDefaultValue(action.formType, action.name, nextState.$configs[action.formType]),
          ),
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].setErrors:
        if (!nextState[action.formType]) return nextState
        return {
          ...nextState,
          [action.formType]: {
            ...nextState[action.formType],
            $errors: action.value,
          },
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].rememberFieldState:
        if (!nextState[action.formType]) return nextState
        return {
          ...nextState,
          [action.formType]: {
            ...nextState[action.formType],
            $edit: getRecursiveObjectReplacement(nextState[action.formType].$edit, action.name, action.value),
          },
        }
      case ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].saveEditingField: {
        if (!nextState[action.formType]) return nextState
        const newEdit = { ...nextState[action.formType].$edit }
        unset(newEdit, action.name)
        return {
          ...nextState,
          [action.formType]: {
            ...nextState[action.formType],
            $edit: newEdit,
          },
        }
      }
      case ROUTER_LOCATION_CHANGE_ACTION:
        if (action.payload.action === 'REPLACE') return nextState
        return {
          ...nextState,
          // Reduces all created forms to find that, that has properties for route reset
          ...Object.keys(nextState.$configs).reduce((memo, formName) => ({
            ...memo,
            [formName]: {
              ...nextState[formName],
              // Reduces form's properties for route reset to reset them
              ...Object.keys(nextState.$configs[formName] && nextState.$configs[formName].onRouteChangeReset || {})
                .reduce((currentObject, key) => ({
                  ...currentObject,
                  [key]: getFormDefaultValue(formName, key, nextState.$configs[formName]),
                }), {}),
              $errors: {},
            },
          }), {}),
        }
      case INIT_ACTION:
        return {
          ...nextState,
          // Reduces all created forms to find that, that has properties for init reset
          ...Object.keys(nextState.$configs).reduce((memo, formName) => ({
            ...memo,
            [formName]: {
              ...nextState[formName],
              // Reduces form's properties for init reset to reset them
              ...Object.keys(nextState.$configs[formName] && nextState.$configs[formName].onRefreshReset || {})
                .reduce((currentObject, key) => ({
                  ...currentObject,
                  [key]: getFormDefaultValue(formName, key, nextState.$configs[formName]),
                }), {}),
              $errors: {},
            },
          }), {}),
        }
      default:
        return nextState
    }
  }

  return generalReducer
}

export default getRestifyFormReducer
