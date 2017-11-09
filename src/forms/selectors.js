import { getNestedObjectField, removePrivateFields, replaceNulls } from 'helpers/nestedObjects'

import { RESTIFY_CONFIG } from '../config'
import { onInitRestify } from '../init'
import { getComposedConfig } from './formConfig'


export const checkErrors = (errors = {}, form = {}, validateAll) => {
  const errorsObj = (typeof errors === 'object' && errors !== null) ? errors : {}
  const formFields = Object.keys(form)
  return Object.keys(errorsObj).every(key => {
    if (!validateAll && formFields.length && !formFields.some(field => field === key)) return true
    const currentErrors = errorsObj[key]
    if (typeof currentErrors === 'object' && !Array.isArray(currentErrors)) return checkErrors(currentErrors, form[key])
    return !currentErrors || (Array.isArray(currentErrors) && !currentErrors.length)
  })
}


const getFormConfig = (formType) => (state) => {
  if (RESTIFY_CONFIG.registeredForms[formType]) {
    return RESTIFY_CONFIG.registeredForms[formType]
  }
  const config = state.forms.$configs[formType]
  return getComposedConfig(config)
}

const globalSelectors = {
  getIsFormExist: (formType) => (state) => !!state.forms[formType],
  getEndpoint: (formType) => () => {
    let formConfig = RESTIFY_CONFIG.registeredForms[formType]
    let apiConfig = {}
    if (formConfig.model) {
      formConfig = RESTIFY_CONFIG.registeredModels[formConfig.model]
    }
    if (formConfig.apiName) {
      apiConfig = RESTIFY_CONFIG.registeredApies[formConfig.apiName]
    }
    return {
      apiHost: apiConfig.apiHost,
      apiPrefix: apiConfig.apiPrefix,
      endpoint: formConfig.endpoint,
    }
  },
  getForm: (formType) => (state) => removePrivateFields(replaceNulls(state.forms[formType])),
  getFormWithNulls: (formType) => (state) => removePrivateFields(state.forms[formType]),
  getField: (formType) => (name) => (state) => getNestedObjectField(state.forms[formType], name),
  getSavedField: (formType) => (name) => (state) => getNestedObjectField(state.forms[formType].$edit, name),
  getErrors: (formType) => (state) => state.forms[formType] && state.forms[formType].$errors || {},
  getIsValid: (formType) => (state) => {
    const formConfig = getFormConfig(formType)(state)
    return checkErrors(
      globalSelectors.getErrors(formType)(state),
      globalSelectors.getForm(formType)(state),
      formConfig.validateAll,
    )
  },
  getEditingFields: (formType) => (state) => state.forms[formType] && state.forms[formType].$edit || {},
}

const getFormSelectors = (formType) => {
  return Object.keys(globalSelectors).reduce((memo, key) => ({
    ...memo,
    [key]: globalSelectors[key](formType),
  }), {})
}

const forms = {
  ...globalSelectors,
  getFormConfig,
  getFormsByRegExp: (formNameRegExp) => (state) => {
    return Object.keys(state.forms).reduce((memo, key) => {
      if (!formNameRegExp.test(key)) return memo
      return {
        ...memo,
        [key]: globalSelectors.getForm(key)(state),
      }
    }, {})
  },
}

onInitRestify(() => {
  RESTIFY_CONFIG.formsTypes.forEach(formType => {
    forms[formType] = getFormSelectors(formType)
  })
})

export default forms
