import {
  initRestify,
  setRestifyStore,
} from '../init'

import api from '../api'
import forms from '../forms'

import { createRestifyStore } from 'helpers/tests'


export const TEST_API_HOST = 'http://test.com/'
export const TEST_TOKEN = 'test-token'
export const TEST_API_PREFIX = 'test-api/v1.0/'
export const TEST_MODEL_ENDPOINT = 'test-model/'

export const apiDefinitions = {
  testApi: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
  },
}

export const modelsDefinitions = {
  testModel: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model',
    defaults: {
      id: undefined,
      test: undefined,
    },
  },
}

export const formsDefinitions = {
  testForm: {
    model: 'testModel',
    defaults: {
      test: true,
      testArray: [
        {
          test: true,
        },
        {
          orderable: true,
        },
      ],
    },
  },
}

export let store

export const beforeEachFunc = (config = {}) => {
  initRestify({
    apiDefinitions,
    modelsDefinitions,
    formsDefinitions,
    ...config,
  })
  const apiReducer = api.getRestifyApiReducer()
  const formsReducer = forms.getRestifyFormReducer()

  store = createRestifyStore(apiReducer, formsReducer)
  setRestifyStore(store)
}
