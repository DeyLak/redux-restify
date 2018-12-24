import defaults from 'lodash/defaults'

import createFormConfig from './forms/formConfig'
import { DEFAULT_API_NAME } from './api/constants'
import createModelConfig from './api/modelConfig'
import ApiXhrAdapter from './api/adapters/ApiXhrAdapter'
import {
  RESTIFY_DEFAULT_OPTIONS,
  RESTIFY_CONFIG,
  registerApiCallbacks,
  registerModelCallbacks,
  registerFormCallbacks,
} from './config'

// Setting store for restify inner actions dispatch
export const setRestifyStore = (store) => {
  RESTIFY_CONFIG.store = store

  RESTIFY_CONFIG.apiesTypes.forEach(apiType => {
    RESTIFY_CONFIG.registeredApies[apiType].dispatch = RESTIFY_CONFIG.store.dispatch
  })
}

const invokeCallbacks = (callbacks, value) => callbacks.forEach(callback => callback(value))

export const onRegisterApi = (func) => {
  registerApiCallbacks.push(func)
}
// Register a new RESTfull api host
export const registerApi = (apiName, config) => {
  if (RESTIFY_CONFIG.registeredApies[apiName] !== undefined) {
    throw new Error(`You tried to register already existing api with name ${apiName}! Try other name.`)
  }
  RESTIFY_CONFIG.registeredApies[apiName] = new ApiXhrAdapter(config)
  invokeCallbacks(registerApiCallbacks, RESTIFY_CONFIG.registeredApies[apiName])
}

export const onRegisterModel = (func) => {
  registerModelCallbacks.push(func)
}
// Register new RESTfull model
export const registerModel = (modelName, config) => {
  if (RESTIFY_CONFIG.registeredModels[modelName] !== undefined) {
    throw new Error(`You tried to register already existing model with name ${modelName}! Try other name.`)
  }
  if (!RESTIFY_CONFIG.registeredApies[DEFAULT_API_NAME] &&
    (!config.apiName || config.apiName === DEFAULT_API_NAME)
  ) {
    throw new Error(
      `You tried to register a model with ${modelName}! with default api. But no default api is registered!`,
    )
  }
  if (config.apiName && !RESTIFY_CONFIG.registeredApies[config.apiName]) {
    throw new Error(
      `You tried to register a model with ${modelName}! with api ${config.apiName}. But no such api is registered!`,
    )
  }
  RESTIFY_CONFIG.registeredModels[modelName] = createModelConfig(config)
  invokeCallbacks(registerModelCallbacks, RESTIFY_CONFIG.registeredModels[modelName])
}

export const onRegisterForm = (func) => {
  registerFormCallbacks.push(func)
}
// Register new RESTfull model
export const registerForm = (formName, config) => {
  if (RESTIFY_CONFIG.registeredForms[formName] !== undefined) {
    throw new Error(`You tried to register already existing form with name ${formName}! Try other name.`)
  }

  RESTIFY_CONFIG.registeredForms[formName] = createFormConfig(config)
  invokeCallbacks(registerFormCallbacks, RESTIFY_CONFIG.registeredForms[formName])
}

const initRestifyCallbacks = []
export const onInitRestify = (func) => {
  initRestifyCallbacks.push(func)
}

export const initRestify = ({
  apiDefinitions = {},
  modelsDefinitions = {},
  formsDefinitions = {},
  options = {},
} = {}) => {
  RESTIFY_CONFIG.store = undefined
  RESTIFY_CONFIG.registeredApies = {}
  RESTIFY_CONFIG.registeredModels = {}
  RESTIFY_CONFIG.registeredForms = {}
  RESTIFY_CONFIG.options = defaults(options, RESTIFY_DEFAULT_OPTIONS)
  Object.keys(apiDefinitions).forEach(key => registerApi(key, apiDefinitions[key]))
  Object.keys(modelsDefinitions).forEach(key => registerModel(key, modelsDefinitions[key]))
  Object.keys(formsDefinitions).forEach(key => registerForm(key, formsDefinitions[key]))
  invokeCallbacks(initRestifyCallbacks)
}
