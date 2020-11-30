export const RESTIFY_DEFAULT_OPTIONS = {
  autoPropertiesIdRequests: true,
  orderableFormFieldName: 'order',
  retries: 0,
  retryTimeoutMs: 1000,
}

const restifyConfig = {
  store: undefined,
  registeredApies: {},
  registeredModels: {},
  registeredForms: {},
  options: RESTIFY_DEFAULT_OPTIONS,
  isRequestsLockSet: false,
}

// TODO by @deylak add api for dynamic entity registration, so we could use restify models in npm packages
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-underscore-dangle
  window.__RESTIFY_CONFIG__ = window.__RESTIFY_CONFIG__ || restifyConfig
}
// eslint-disable-next-line no-underscore-dangle
export const RESTIFY_CONFIG = typeof window === 'undefined' ? restifyConfig : window.__RESTIFY_CONFIG__

Object.defineProperty(RESTIFY_CONFIG, 'apiesTypes', {
  configurable: true,
  get: () => {
    return Object.keys(RESTIFY_CONFIG.registeredApies)
  },
})

Object.defineProperty(RESTIFY_CONFIG, 'modelsTypes', {
  configurable: true,
  get: () => {
    return Object.keys(RESTIFY_CONFIG.registeredModels)
  },
})

Object.defineProperty(RESTIFY_CONFIG, 'formsTypes', {
  configurable: true,
  get: () => {
    return Object.keys(RESTIFY_CONFIG.registeredForms)
  },
})


export const registerFormCallbacks = [
]

export const registerModelCallbacks = [
]

export const registerApiCallbacks = [
]
