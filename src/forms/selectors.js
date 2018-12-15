import { getNestedObjectField, removePrivateFields, replaceNulls } from '~/helpers/nestedObjects'

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

const getFormsMap = (formType, state, mapFunction) => {
  if (formType instanceof RegExp) {
    return Object.keys(state.forms).reduce((memo, key) => {
      if (!formType.test(key)) return memo
      return {
        ...memo,
        [key]: mapFunction(key, state),
      }
    }, {})
  }
  return mapFunction(formType)
}

const getFormConfig = (formType) => (state) => {
  return getFormsMap(formType, state, (stringType) => {
    if (RESTIFY_CONFIG.registeredForms[stringType]) {
      return RESTIFY_CONFIG.registeredForms[stringType]
    }
    const config = state.forms.$configs[stringType]
    return getComposedConfig(config)
  })
}


const globalSelectors = {
  getIsFormExist: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => !!state.forms[stringType])
  },
  getEndpoint: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => {
      let formConfig = RESTIFY_CONFIG.registeredForms[stringType]
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
    })
  },
  getForm: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => removePrivateFields(replaceNulls(state.forms[stringType])))
  },
  getFormWithNulls: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => removePrivateFields(state.forms[stringType]))
  },
  getField: (formType) => (name) => (state) => {
    return getFormsMap(formType, state, (stringType) => getNestedObjectField(state.forms[stringType], name))
  },
  getSavedField: (formType) => (name) => (state) => {
    return getFormsMap(formType, state, (stringType) => getNestedObjectField(state.forms[stringType].$edit, name))
  },
  getErrors: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => {
      return state.forms[stringType] && state.forms[stringType].$errors || {}
    })
  },
  getIsValid: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => {
      const formConfig = getFormConfig(stringType)(state)
      return checkErrors(
        globalSelectors.getErrors(stringType)(state),
        globalSelectors.getForm(stringType)(state),
        formConfig.validateAll,
      )
    })
  },
  getEditingFields: (formType) => (state) => {
    return getFormsMap(formType, state, (stringType) => state.forms[stringType] && state.forms[stringType].$edit || {})
  },
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
  getFormsMap,
}

onInitRestify(() => {
  RESTIFY_CONFIG.formsTypes.forEach(formType => {
    forms[formType] = getFormSelectors(formType)
  })
})

export default forms
