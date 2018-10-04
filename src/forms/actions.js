import uuidV4 from 'uuid/v4'
import deepEqual from 'deep-equal'
import sortBy from 'lodash/sortBy'
import defaults from 'lodash/defaults'
import { batchActions } from 'redux-batched-actions'

import {
  ACTIONS_TYPES,
  getActionType,
  GENERAL_FORMS_ACTIONS,
} from './constants'
import createFormConfig, {
  ARRAY_DEFAULTS_INDEX,
  ARRAY_CONFIG_INDEX,
  getFormArrayConfig,
  getFormDefaultValue,
  updateDefaultValue,
} from './formConfig'
import selectors, { checkErrors } from './selectors'
import { ValidationPreset } from './validation'

import { objectToLowerSnake } from 'helpers/namingNotation'
import { isPureObject } from 'helpers/def'
import { mutateObject, getRecursiveObjectReplacement, getNestedObjectField } from 'helpers/nestedObjects'

import api, {
  RestifyArray,
  RestifyLinkedModel,
  RestifyGenericForeignKey,
  CRUD_ACTIONS,
} from '../api'
import { defaulTransformEntityResponse } from '../api/actions/entityManager'
import { RESTIFY_CONFIG } from '../config'
import { onInitRestify } from '../init'
import { ACTION_UPDATE, ACTION_CREATE } from '../constants'


const generalActions = {
  deleteForm: (formType) => ({
    type: ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].deleteForm,
    formType,
  }),

  resetForm: (formType) => ({
    type: ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].resetForm,
    formType,
  }),

  renameForm: (formType, formName) => ({
    type: ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].renameForm,
    formType,
    formName,
  }),

  createForm: (formType, config, allowRecreate = false) => (dispatch, getState) => {
    if (allowRecreate && selectors.getIsFormExist(formType)(getState())) {
      dispatch(generalActions.deleteForm(formType))
    }
    return dispatch({
      type: ACTIONS_TYPES[GENERAL_FORMS_ACTIONS].createForm,
      formType,
      config,
    })
  },
}

const globalActions = {
  deleteForm: (formType) => () => generalActions.deleteForm(formType),
  resetForm: (formType) => () => generalActions.resetForm(formType),
  renameForm: (formType) => (formName) => generalActions.renameForm(formType, formName),

  changeField: (formType) => (name, newValue) => (dispatch, getState) => {
    let value = newValue

    const state = getState()
    const currentFormConfig = selectors.getFormConfig(formType)(state)
    const orderFieldName = RESTIFY_CONFIG.options.orderableFormFieldName

    // Manage orderable arrays
    if (Array.isArray(value)) {
      const arrayConfig = getFormArrayConfig(formType, name, currentFormConfig)
      if (arrayConfig.orderable) {
        value = value.map((item, order) => ({ ...item, [orderFieldName]: order }))
      }
    }

    dispatch({
      type: getActionType(formType).changeField,
      name,
      value,
      formType,
    })

    if (currentFormConfig.validate && currentFormConfig.validateOnFieldChange) {
      dispatch(globalActions.validate(formType)())
    }
  },

  changeSomeFields: (formType) => (fieldsObject = {}, forceUndefines = false) => (dispatch, getState) => {
    const state = getState()
    const currentFormConfig = selectors.getFormConfig(formType)(state)

    const valuesObj = {}
    const orderFieldName = RESTIFY_CONFIG.options.orderableFormFieldName
    Object.keys(fieldsObject).forEach(key => {
      let currentValue = fieldsObject[key]

      if (Array.isArray(currentValue)) {
        const arrayConfig = getFormArrayConfig(formType, key, currentFormConfig)
        if (arrayConfig.orderable) {
          currentValue = currentValue.map((item, order) => ({ ...item, [orderFieldName]: order }))
        }
      }
      if (forceUndefines || currentValue !== undefined) {
        valuesObj[key] = currentValue
      }
    })

    dispatch({
      type: getActionType(formType).changeSomeFields,
      valuesObj,
      formType,
    })

    if (currentFormConfig.validate && currentFormConfig.validateOnFieldChange) {
      dispatch(globalActions.validate(formType)())
    }
  },

  applyServerData: (formType) => (data) => (dispatch, getState) => {
    const state = getState()
    const currentFormConfig = selectors.getFormConfig(formType)(state)
    let currentModel
    if (currentFormConfig.model) {
      currentModel = RESTIFY_CONFIG.registeredModels[currentFormConfig.model]
    }
    // Technical fields, that should not be included in form, cause they are used only for restify models
    let keysToPass = []
    if (currentFormConfig.mapServerDataToIds) {
      keysToPass = Object.keys(currentModel.defaults).reduce((memo, key) => {
        const currentField = currentModel.defaults[key]
        if (currentField instanceof RestifyLinkedModel) {
          let result = memo.concat(currentField.getIdField(key))
          if (currentField instanceof RestifyGenericForeignKey) {
            result = result.concat(currentField.getTypeField(key))
          }
          return result
        }
        return memo
      }, [])
    }
    const dataReduceFunc = (prevName) => (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj
      if (Array.isArray(obj)) {
        const arrayConfig = getFormArrayConfig(formType, prevName, currentFormConfig)
        if (arrayConfig.orderable) {
          return sortBy(obj, RESTIFY_CONFIG.options.orderableFormFieldName)
        }
        return obj.map((item, index) => {
          return dataReduceFunc(prevName.concat(index))(item)
        })
      }
      if (!currentFormConfig.mapServerDataToIds) {
        return Object.keys(obj).reduce((memo, key) => ({
          ...memo,
          [key]: dataReduceFunc(prevName.concat(key))(obj[key]),
        }), {})
      }
      return Object.keys(obj).reduce((memo, key) => {
        if (keysToPass.includes(key)) {
          return memo
        }
        let keyValue
        let currentField
        if (currentModel && currentModel.defaults[key]) {
          currentField = currentModel.defaults[key]
        }
        if (currentField &&
          (currentField instanceof RestifyLinkedModel)) {
          if (currentField instanceof RestifyGenericForeignKey) {
            const currentFieldModel = RESTIFY_CONFIG.registeredModels[obj[currentField.getTypeField(key)]]
            const currentApi = RESTIFY_CONFIG.registeredApies[currentFieldModel.apiName]
            keyValue = currentApi.getGenericFormField(obj[key])
          } else {
            keyValue = obj[currentField.getIdField(key)]
          }
        } else {
          keyValue = dataReduceFunc(prevName.concat(key))(obj[key])
        }
        return {
          ...memo,
          [key]: keyValue,
        }
      }, {})
    }

    return dispatch(globalActions.changeSomeFields(formType)(dataReduceFunc([])(data)))
  },

  resetField: (formType) => (name) => ({
    type: getActionType(formType).resetField,
    name,
    formType,
  }),

  insertToArray: (formType) => (arrayName, value, insertingIndex) => (dispatch, getState) => {
    const state = getState()
    const currentFormConfig = selectors.getFormConfig(formType)(state)
    const configArrayName = !Array.isArray(arrayName) ? arrayName : arrayName.map(name => {
      return typeof name === 'string' ? name : 0
    })
    const arrayConfig = getNestedObjectField(currentFormConfig.defaults, configArrayName)[ARRAY_CONFIG_INDEX]

    // fakeId plugin
    let newValue = value
    if (arrayConfig && arrayConfig.fakeId) {
      newValue = {
        ...newValue,
        id: uuidV4(),
      }
    }
    newValue = updateDefaultValue(
      getFormDefaultValue(formType, [].concat(arrayName, 0), currentFormConfig),
      newValue,
    )
    const newArray = selectors.getField(formType)(arrayName)(state).slice()
    let index = insertingIndex
    if (index !== undefined) {
      if (index < 0) {
        index = 0
      }
      if (index > newArray.length) {
        index = newArray.length
      }
      newArray.splice(index, 0, newValue)
    } else {
      newArray.push(newValue)
    }
    dispatch(globalActions.changeField(formType)(arrayName, newArray))
    return index === undefined ? newArray.length - 1 : index
  },

  insertToArrayAndEdit: (formType) => (arrayName, value, index) => (dispatch) => {
    const newIndex = dispatch(globalActions.insertToArray(formType)(arrayName, value, index))
    dispatch(globalActions.rememberFieldState(formType)([].concat(arrayName, newIndex), null))
  },

  manageSavedFieldArrayDeletion: (formType) => (arrayName, index) => (dispatch, getState) => {
    const state = getState()
    const editingFields = selectors.getEditingFields(formType)(state)
    const arrayEditingFields = getNestedObjectField(editingFields, arrayName)
    const batchedActions = []
    Object.keys(arrayEditingFields || {}).map(key => +key).forEach(key => {
      if (key < index) return
      const currentPath = [].concat(arrayName, key)
      if (key === index) {
        batchedActions.push(globalActions.saveEditingField(formType)(currentPath))
      } else {
        const rememberedField = arrayEditingFields[key]
        batchedActions.push(globalActions.saveEditingField(formType)(currentPath))
        batchedActions.push(globalActions.rememberFieldState(formType)([].concat(arrayName, key - 1), rememberedField))
      }
    })

    dispatch(batchActions(batchedActions))
  },

  manageSavedFieldArrayInsertion: (formType) => (arrayName, index, insertedField) => (dispatch, getState) => {
    const state = getState()
    const editingFields = selectors.getEditingFields(formType)(state)
    const arrayEditingFields = getNestedObjectField(editingFields, arrayName)
    const batchedActions = []
    Object.keys(arrayEditingFields || {}).map(key => +key).forEach(key => {
      if (key < index) return
      const currentPath = [].concat(arrayName, key)
      batchedActions.push(globalActions.saveEditingField(formType)(currentPath))
      if (key === index && insertedField) {
        batchedActions.push(globalActions.rememberFieldState(formType)(currentPath, insertedField))
      } else {
        const rememberedField = arrayEditingFields[key]
        batchedActions.push(globalActions.rememberFieldState(formType)([].concat(arrayName, key + 1), rememberedField))
      }
    })

    dispatch(batchActions(batchedActions))
  },

  removeFromArray: (formType) => (arrayName, index = 0, count = 1) => (dispatch, getState) => {
    const state = getState()
    let newArray = selectors.getField(formType)(arrayName)(state).slice()
    if (Array.isArray(index)) {
      newArray = newArray.filter((_, i) => !index.includes(i))
    } else {
      newArray.splice(index, count)
    }
    // TODO reset all arrays for count
    dispatch(globalActions.changeField(formType)(arrayName, newArray))
    dispatch(globalActions.resetArrayErrors(formType)(arrayName, newArray.length))
    dispatch(globalActions.manageSavedFieldArrayDeletion(formType)(arrayName, index))
  },

  replaceInArray: (formType) => (arrayName, value, index) => (dispatch, getState) => {
    const state = getState()
    const currentFormConfig = selectors.getFormConfig(formType)(state)
    const configArrayName = !Array.isArray(arrayName) ? arrayName : arrayName.map(name => {
      return typeof name === 'string' ? name : 0
    })
    const arrayConfig = getNestedObjectField(currentFormConfig.defaults, configArrayName)[ARRAY_CONFIG_INDEX]
    // fakeId plugin
    let newValue = value
    if (arrayConfig && arrayConfig.fakeId) {
      newValue = {
        ...newValue,
        id: uuidV4(),
      }
    }
    newValue = updateDefaultValue(
      getFormDefaultValue(formType, [].concat(arrayName, 0), currentFormConfig),
      newValue,
    )
    const newArray = selectors.getField(formType)(arrayName)(state).slice()
    newArray.splice(index, 1, newValue)
    dispatch(globalActions.changeField(formType)(arrayName, newArray))
  },

  moveInArray: (formType) => (arrayName, movingIndex, insertingIndex) => (dispatch, getState) => {
    const state = getState()
    const currentValue = selectors.getField(formType)([].concat(arrayName, movingIndex))(state)
    const newArray = selectors.getField(formType)(arrayName)(state).slice()
    // We should not reuse insertion/deletion actions here, due to rerenders and animations lagging
    newArray.splice(movingIndex, 1)
    dispatch(globalActions.manageSavedFieldArrayDeletion(formType)(arrayName, movingIndex))
    newArray.splice(insertingIndex, 0, currentValue)

    const editingFields = selectors.getEditingFields(formType)(state)
    const arrayEditingFields = getNestedObjectField(editingFields, arrayName)
    if (arrayEditingFields) {
      const editableInsertedValue = arrayEditingFields[movingIndex]
      dispatch(globalActions.manageSavedFieldArrayInsertion(formType)(arrayName, insertingIndex, editableInsertedValue))
    }

    dispatch(globalActions.changeField(formType)(arrayName, newArray))
  },

  moveInArrayUp: (formType) => (arrayName, movingIndex) => (dispatch) => {
    dispatch(globalActions.moveInArray(formType)(arrayName, movingIndex, movingIndex - 1))
  },

  moveInArrayDown: (formType) => (arrayName, movingIndex) => (dispatch) => {
    dispatch(globalActions.moveInArray(formType)(arrayName, movingIndex, movingIndex + 1))
  },

  changeInArray: (formType) => (arrayName, name, value, index) => (dispatch, getState) => {
    const state = getState()
    const currentArray = selectors.getField(formType)(arrayName)(state)
    const newValue = {
      ...currentArray[index],
      [name]: value,
    }
    dispatch(globalActions.replaceInArray(formType)(arrayName, newValue, index))
  },

  setErrors: (formType) => (value) => ({
    type: getActionType(formType).setErrors,
    value,
    formType,
  }),

  resetErrors: (formType) => () => ({
    type: getActionType(formType).setErrors,
    value: {},
    formType,
  }),

  setFieldError: (formType) => (name, value) => (dispatch, getState) => {
    return dispatch({
      type: getActionType(formType).setErrors,
      value: getRecursiveObjectReplacement(selectors.getErrors(formType)(getState()), name, value),
      formType,
    })
  },

  resetFieldError: (formType) => (name) => (dispatch, getState) => {
    return dispatch({
      type: getActionType(formType).setErrors,
      value: getRecursiveObjectReplacement(selectors.getErrors(formType)(getState()), name, []),
      formType,
    })
  },

  resetArrayErrors: (formType) => (arrayName, index) => (dispatch, getState) => {
    const state = getState()
    const currentArrayErrors = getNestedObjectField(selectors.getErrors(formType)(state), arrayName) || {}
    return dispatch(globalActions.setFieldError(formType)(arrayName, {
      ...currentArrayErrors,
      [index]: {},
    }))
  },

  setArrayFieldErrors: (formType) => (arrayName, name, value, index) => (dispatch, getState) => {
    const state = getState()
    const currentArrayErrors = getNestedObjectField(selectors.getErrors(formType)(state), arrayName) || {}
    const currentArrayFieldErrors = currentArrayErrors[index] || {}
    return dispatch(globalActions.setFieldError(formType)(arrayName, {
      ...currentArrayErrors,
      [index]: getRecursiveObjectReplacement(currentArrayFieldErrors, name, value),
    }))
  },

  resetArrayFieldErrors: (formType) => (arrayName, name, index) => (dispatch) => {
    return dispatch(globalActions.setArrayFieldErrors(formType)(arrayName, name, [], index))
  },

  rememberFieldState: (formType) => (name, value) => ({
    type: getActionType(formType).rememberFieldState,
    value,
    name,
    formType,
  }),

  enableFieldEditMode: (formType) => (name) => (dispatch, getState) => {
    const state = getState()
    const fieldToRemember = selectors.getField(formType)(name)(state)
    return dispatch(globalActions.rememberFieldState(formType)(name, fieldToRemember))
  },

  saveEditingField: (formType) => (name) => ({
    type: getActionType(formType).saveEditingField,
    name,
    formType,
  }),

  validate: (formType) => () => (dispatch, getState) => {
    const state = getState()
    const currentForm = selectors.getFormConfig(formType)(state)
    if (!currentForm.validate) return {}

    const currentValues = selectors.getForm(formType)(state)

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
        addToValidationResult(validationField.validate(currentLevelValues, currentValues), currentPath)
      } else if (typeof validationField === 'function') {
        addToValidationResult(validationField(currentLevelValues, currentValues, getState), currentPath)
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
    calucalateCurrentLevelValidate(currentValues, currentForm.validate)
    const currentErrors = selectors.getErrors(formType)(state)
    // Validation result should prevaluate under current errors,
    // but we should also not remove errors, which are not included in validation function
    const newErrors = defaults({}, validationResult, currentErrors)
    if (!deepEqual(currentErrors, newErrors)) {
      dispatch(globalActions.setErrors(formType)(newErrors))
    }
    return newErrors
  },

  cancelFieldEdit: (formType) => (name) => (dispatch, getState) => {
    const state = getState()
    const savedField = selectors.getSavedField(formType)(name)(state)
    if (savedField === null) {
      const arrayName = name.slice(0, name.length - 1)
      const index = name[name.length - 1]
      dispatch(globalActions.removeFromArray(formType)(arrayName, index))
    } else {
      dispatch(globalActions.changeField(formType)(name, savedField))
      dispatch(globalActions.saveEditingField(formType)(name))
    }
  },

  submit: (formType) => () => (dispatch, getState) => {
    let state = getState()
    const currentForm = selectors.getFormConfig(formType)(state)
    let currentModel
    if (currentForm.model) {
      currentModel = RESTIFY_CONFIG.registeredModels[currentForm.model]
    }
    let idField = 'id'
    let currentApi
    if (currentModel) {
      idField = currentModel.idField
      currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]
    }
    if (currentForm.validate && currentForm.validateOnSubmit) {
      const errors = dispatch(globalActions.validate(formType)())
      if (!checkErrors(errors)) {
        return Promise.reject(errors)
      }
    }
    if (!currentForm.endpoint && !currentForm.model) {
      console.warn(`Submitting a form ${formType} has no effect, cause it doesn't have endpoint or model`)
      return Promise.resolve()
    }
    const currentValues = selectors.getFormWithNulls(formType)(state)


    let submitExcludeFunc = currentForm.submitExclude
    if (typeof currentForm.submitExclude === 'object') {
      submitExcludeFunc = (key, values, keyParentPath) => {
        return getNestedObjectField(currentForm.submitExclude, keyParentPath.concat(key)) === true
      }
    }
    let data = mutateObject(
      (key, value, obj, keyParentPath) => {
        if (submitExcludeFunc(key, currentValues, keyParentPath)) return true
        // fakeId plugin checks for fake uuids(string, instead of number) not to send them
        let parentConfig
        if (Array.isArray(keyParentPath)) {
          parentConfig = keyParentPath.reduce((memo, name, index) => {
            if (!memo || !memo[name]) return undefined
            const currentObj = memo[name]
            if (Array.isArray(currentObj)) {
              return currentObj[index === keyParentPath.length - 1 ? ARRAY_CONFIG_INDEX : ARRAY_DEFAULTS_INDEX]
            }
            return currentObj
          }, currentForm.defaults)
        } else {
          parentConfig = currentForm.defaults[keyParentPath]
          if (Array.isArray(parentConfig)) {
            parentConfig = parentConfig[ARRAY_CONFIG_INDEX]
          }
        }
        if (!parentConfig) return false
        if (parentConfig && parentConfig.fakeId && key === idField) {
          return typeof value === 'string'
        }
        return false
      },
      () => undefined,
    )(currentValues)

    if (typeof currentForm.transformBeforeSubmit === 'function') {
      data = currentForm.transformBeforeSubmit(currentValues)
    } else if (typeof currentForm.transformBeforeSubmit === 'object') {
      Object.keys(currentForm.transformBeforeSubmit).forEach(key => {
        data[key] = currentForm.transformBeforeSubmit[key](key, data[key], currentValues)
      })
    }
    return new Promise((resolve, reject) => {
      const successCallbacks = []
      const errorCallbacks = []
      if (currentForm.deleteOnSubmit) {
        successCallbacks.push(generalActions.deleteForm(formType))
      }
      if (currentForm.resetOnSubmit) {
        successCallbacks.push(generalActions.resetForm(formType))
      }
      if (currentForm.onSuccess) {
        successCallbacks.push(currentForm.onSuccess)
      }

      let url = currentForm.endpoint
      if (typeof url === 'function') {
        url = url(currentValues)
      }
      let currentApiName = currentForm.apiName
      const currentId = data.id || currentForm.id
      if (currentModel) {
        url = currentModel.endpoint
        currentApiName = currentModel.apiName
        if (currentId) {
          dispatch(api.actions.entityManager[currentForm.model].updateOptimisticById(currentId, data))
          errorCallbacks.push(api.actions.entityManager[currentForm.model].discardOptimisticUpdateById(currentId))
        }
        const actionType = currentId ? ACTION_UPDATE : ACTION_CREATE
        successCallbacks.push(() => api.actions.entityManager[currentForm.model].showEntityAlert(actionType))
        // TODO by @deylak rework alerts api, so we don't need this hacks
        if (
          Object.prototype.hasOwnProperty.call(currentForm, 'SECRET_SHOW_ALERTS') &&
          !currentForm.SECRET_SHOW_ALERTS
        ) {
          successCallbacks.pop()
        }
      }

      // Workaround for dispatching callbacks(behaves like thunk function)
      successCallbacks.push((res, status) => () => {
        const transformEntityResponse = currentModel && currentModel.transformEntityResponse ||
                                        currentApi && currentApi.transformEntityResponse ||
                                        defaulTransformEntityResponse
        const transformed = transformEntityResponse(res).data
        if (transformed && currentModel && currentForm.updateEntity) {
          dispatch(
            api.actions.entityManager[currentForm.model].updateById(transformed[idField], transformed),
          )
        }
        if (transformed && currentForm.model && transformed[idField]) {
          state = getState()
          resolve({
            data: api.selectors.entityManager[currentForm.model].getEntities(state).getById(transformed[idField]),
            status,
          })
        } else {
          resolve({ data: res, status })
        }
      })
      errorCallbacks.push((res, status) => () => reject({ data: res, status }))

      errorCallbacks.push(globalActions.setErrors(formType))

      const defaultMethod = currentId ? 'patch' : 'post'
      const currentCrudAction = currentId ? CRUD_ACTIONS.update : CRUD_ACTIONS.create
      dispatch(api.actions.callApi(defaultMethod)({
        apiName: currentApiName,
        id: currentId,
        crudAction: currentForm.crudAction || currentCrudAction,
        url,
        specialAction: currentForm.specialAction,
        getEntityUrl: currentModel && currentModel.getEntityUrl,
        forceMethod: currentForm.method,

        onError: errorCallbacks,
        onSuccess: successCallbacks,
        data: currentForm.convertToSnakeCaseBeforeSend ? objectToLowerSnake(data) : data,
        convertToCamelCase: currentForm.convertResultToCamelCase,
        removeNulls: currentForm.resultRemoveNulls,
        orderArrays: currentForm.resultOrderArrays,
        withoutPrefix: currentForm.withoutPrefix,
      }))
    })
  },
}

const getSingleFormActions = (formType) => {
  return Object.keys(globalActions).reduce((memo, key) => ({
    ...memo,
    [key]: globalActions[key](formType),
  }), {})
}

export const getFormActions = (formType) => {
  if (Array.isArray(formType)) {
    return formType.reduce((memo, type) => ({
      ...memo,
      [type]: getSingleFormActions(type),
    }), {})
  }
  return getSingleFormActions(formType)
}

const forms = {
  ...globalActions,
  ...generalActions,

  sendQuickForm: (config) => (dispatch) => {
    const newForm = createFormConfig({
      ...config,
      deleteOnSubmit: true,
    })
    const formName = uuidV4()
    dispatch(generalActions.createForm(formName, newForm, true))
    return dispatch(globalActions.submit(formName)())
  },
}

onInitRestify(() => {
  RESTIFY_CONFIG.formsTypes.forEach(formType => {
    forms[formType] = getFormActions(formType)
  })
})

export default forms
