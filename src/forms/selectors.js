import { createSelector } from 'reselect'

import { getNestedObjectField, removePrivateFields, replaceNulls } from '~/helpers/nestedObjects'

import { RESTIFY_CONFIG } from '../config'
import { onInitRestify } from '../init'
import { getComposedConfig } from './formConfig'


export const checkErrors = (errors = {}, form, validateAll) => {
  const errorsObj = (typeof errors === 'object' && errors !== null) ? errors : {}
  const formFields = Object.keys(form || {})
  return Object.keys(errorsObj).every(key => {
    if (!validateAll && formFields.length && !formFields.some(field => field === key)) return true
    const currentErrors = errorsObj[key]
    if (typeof currentErrors === 'object' && !Array.isArray(currentErrors)) {
      return checkErrors(currentErrors, form && form[key])
    }
    return !currentErrors || (Array.isArray(currentErrors) && !currentErrors.length)
  })
}

const getFormsMap = (formType, selector, mapFunction) => {
  if (formType instanceof RegExp) {
    return state => {
      return Object.keys(state.forms).reduce((memo, key) => {
        if (!formType.test(key)) return memo
        const currentSelectedValue = selector(key)(state)
        return {
          ...memo,
          [key]: mapFunction(currentSelectedValue, key),
        }
      }, {})
    }
  }
  return createSelector(
    selector(formType),
    selectedForm => mapFunction(selectedForm, formType),
  )
}

const getFormConfig = (formType) => {
  return getFormsMap(
    formType,
    () => state => state.forms.$configs,
    (selectedForm, stringType) => {
      if (RESTIFY_CONFIG.registeredForms[stringType]) {
        return RESTIFY_CONFIG.registeredForms[stringType]
      }
      const config = selectedForm[stringType]
      return getComposedConfig(config)
    },
  )
}


const globalSelectors = {
  getIsFormExist: (formType) => {
    return getFormsMap(
      formType,
      () => state => state.forms,
      (selectedForm, stringType) => !!selectedForm[stringType],
    )
  },
  getEndpoint: (formType) => {
    return getFormsMap(
      formType,
      () => () => null,
      (selectedForm, stringType) => {
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
      },
    )
  },
  getForm: (formType) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => removePrivateFields(replaceNulls(selectedForm)),
    )
  },
  getFormWithNulls: (formType) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => removePrivateFields(selectedForm),
    )
  },
  getField: (formType) => (name) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => getNestedObjectField(selectedForm, name),
    )
  },
  getSavedField: (formType) => (name) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => getNestedObjectField(selectedForm.$edit, name),
    )
  },
  getErrors: (formType) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => {
        return (selectedForm && selectedForm.$errors) || {}
      },
    )
  },
  getIsValid: (formType) => {
    return getFormsMap(
      formType,
      () => state => state,
      (state, stringType) => {
        const formConfig = getFormConfig(stringType)(state)
        return checkErrors(
          globalSelectors.getErrors(stringType)(state),
          globalSelectors.getForm(stringType)(state),
          formConfig.validateAll,
        )
      },
    )
  },
  getDirtyFields: (formType) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => {
        return (selectedForm && selectedForm.$dirty) || {}
      },
    )
  },
  getIsDirty: (formType) => {
    return getFormsMap(
      formType,
      () => state => state,
      (state, stringType) => {
        const dirtyFields = globalSelectors.getDirtyFields(stringType)(state)
        return Object.values(dirtyFields).some(isDirty => isDirty)
      },
    )
  },
  getEditingFields: (formType) => {
    return getFormsMap(
      formType,
      stringType => state => state.forms[stringType],
      (selectedForm) => selectedForm && selectedForm.$edit || {},
    )
  },
}

const getFormSelectors = (formType) => {
  return Object.keys(globalSelectors).reduce((memo, key) => ({
    ...memo,
    [key]: globalSelectors[key](formType),
  }), {})
}

const restifyForms = {
  ...globalSelectors,
  getFormConfig,
  getFormsMap,
}

if (typeof window !== 'undefined') {
// eslint-disable-next-line no-underscore-dangle
  window.__RESTIFY_FORMS__ = window.__RESTIFY_FORMS__ || restifyForms
}

// eslint-disable-next-line no-underscore-dangle
const forms = typeof window === 'undefined' ? restifyForms : window.__RESTIFY_FORMS__

onInitRestify(({ formKeys = {} } = {}) => {
  formKeys.forEach(formType => {
    forms[formType] = getFormSelectors(formType)
  })
})

export default forms
