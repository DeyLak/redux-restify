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
export const OTHER_TEST_API_PREFIX = 'other-test-api/v2.0/'
export const TEST_MODEL_ENDPOINT = 'test-model/'

export const modelUrl = `${TEST_API_HOST}${TEST_API_PREFIX}${TEST_MODEL_ENDPOINT}`

export const responseHeaders = [
  {
    name: 'Content-type',
    value: 'application/json',
  },
]

export const apiDefinitions = {
  testApi: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
  },
  otherTestApi: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: OTHER_TEST_API_PREFIX,
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
  testModelOtherId: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model other id',
    idField: 'specialId',
    defaults: {
      specialId: undefined,
      test: undefined,
    },
  },
}

export const formsDefinitions = {
  testForm: {
    model: 'testModel',
    defaults: {
      transformedField: undefined,
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
    transformBeforeSubmit: {
      transformedField: (key, value, formValues) => {
        return formValues.test
      },
    },
  },
  testRequestFormId: {
    model: 'testModel',
    defaults: {
      test: undefined,
    },
  },
  testRequestFormOtherId: {
    model: 'testModelOtherId',
    defaults: {
      test: undefined,
    },
  },
  arrayTestForm: {
    model: 'testModel',
    defaults: {
      arrayField: [
        {
          test: true,
        },
        {
          count: 5,
        },
      ],
    },
    transformBeforeSubmit: (data) => {
      return data.arrayField
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
