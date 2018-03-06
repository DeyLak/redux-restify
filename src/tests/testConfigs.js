import {
  initRestify,
  setRestifyStore,
} from '../init'

import api from '../api'
import RestifyForeignKeysArray from '../api/models/RestifyForeignKeysArray'
import RestifyForeignKey from '../api/models/RestifyForeignKey'
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
      notInForeignKey: undefined,
    },
  },
  testModelOtherId: {
    clearDataOnRouteChange: true,
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model other id',
    idField: 'specialId',
    defaults: {
      specialId: undefined,
      test: undefined,
    },
  },
  testModelWithForeignKey: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with foreign key',
    pagination: false,
    defaults: {
      id: undefined,
      test: undefined,
      singleForeignKey: new RestifyForeignKey('testModel'),
      notInArray: new RestifyForeignKeysArray('testModel'),
      notInForeignKey: undefined,
    },
  },
  testModelWithForeignKey2: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with foreign key 2',
    pagination: false,
    defaults: {
      id: undefined,
      foreignKeys: new RestifyForeignKeysArray('testModelWithForeignKey'),
    },
  },
  testModelWithoutRequests: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    allowIdRequests: false,
    name: 'Test model with without requests',
    defaults: {
      test: undefined,
    },
  },
  recursiveModelFirst: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Recursive foreign key test model first',
    defaults: {
      id: undefined,
      foreignKey: new RestifyForeignKey('recursiveModelSecond'),
    },
  },
  recursiveModelSecond: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Recursive foreign key test model second',
    defaults: {
      id: undefined,
      foreignKey: new RestifyForeignKey('recursiveModelFirst', {
        allowNested: false,
      }),
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
  foreignKeyTestForm: {
    model: 'testModelWithForeignKey',
    defaults: {
      test: undefined,
    },
    mapServerDataToIds: true,
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
