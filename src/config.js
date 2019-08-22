export const RESTIFY_DEFAULT_OPTIONS = {
  autoPropertiesIdRequests: true,
  orderableFormFieldName: 'order',
}

const restifyConfig = {
  store: undefined,
  registeredApies: {},
  registeredModels: {},
  registeredForms: {},
  options: RESTIFY_DEFAULT_OPTIONS,
}

// TODO by @deylak add api for dinamic entity registration, so we could use restify models in npm packages
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-underscore-dangle
  window.__RESTIFY_CONFIG__ = window.__RESTIFY_CONFIG__ || restifyConfig
}
// eslint-disable-next-line no-underscore-dangle
export const RESTIFY_CONFIG = typeof window === 'undefined' ? restifyConfig : window.__RESTIFY_CONFIG__

let $apiesTypes
Object.defineProperty(RESTIFY_CONFIG, 'apiesTypes', {
  get: () => {
    if ($apiesTypes) {
      return $apiesTypes
    }
    $apiesTypes = Object.keys(RESTIFY_CONFIG.registeredApies)
    return $apiesTypes
  },
})

let $modelsTypes
Object.defineProperty(RESTIFY_CONFIG, 'modelsTypes', {
  get: () => {
    if ($modelsTypes) {
      return $modelsTypes
    }
    $modelsTypes = Object.keys(RESTIFY_CONFIG.registeredModels)
    return $modelsTypes
  },
})

let $formsTypes
Object.defineProperty(RESTIFY_CONFIG, 'formsTypes', {
  get: () => {
    if ($formsTypes) {
      return $formsTypes
    }
    $formsTypes = Object.keys(RESTIFY_CONFIG.registeredForms)
    return $formsTypes
  },
})


export const registerFormCallbacks = [
  () => { // Clearing private fields for singletons recalcultaion
    $formsTypes = undefined
  },
]

export const registerModelCallbacks = [
  () => { // Clearing private fields for singletons recalcultaion
    $modelsTypes = undefined
  },
]

export const registerApiCallbacks = [
  () => { // Clearing private fields for singletons recalcultaion
    $apiesTypes = undefined
  },
]
