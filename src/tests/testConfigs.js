import {
  initRestify,
  setRestifyStore,
} from '../init'

import api, { CRUD_ACTIONS } from '../api'
import RestifyForeignKeysArray from '../api/models/RestifyForeignKeysArray'
import RestifyForeignKey from '../api/models/RestifyForeignKey'
import forms from '../forms'

import { createRestifyStore } from 'helpers/tests'


export const TEST_API_HOST = 'http://test.com/'
export const TEST_TOKEN = 'test-token'
export const TEST_API_PREFIX = 'test-api/v1.0/'
export const OTHER_TEST_API_PREFIX = 'other-test-api/v2.0/'
export const CUSTOM_TEST_API_PREFIX = 'custom-test-api/data/'
export const TEST_MODEL_ENDPOINT = 'test-model/'

export const modelUrl = `${TEST_API_HOST}${TEST_API_PREFIX}${TEST_MODEL_ENDPOINT}`
export const customModelBulkUrl = `${TEST_API_HOST}${CUSTOM_TEST_API_PREFIX}bulk/${TEST_MODEL_ENDPOINT}`
export const customModelSingleUrl = `${TEST_API_HOST}${CUSTOM_TEST_API_PREFIX}single/${TEST_MODEL_ENDPOINT}`

export const responseHeaders = [
  {
    name: 'Content-type',
    value: 'application/json',
  },
]

const customGetEntityUrl = ({
  apiHost,
  apiPrefix,
  modelEndpoint,
  entityId,
  crudAction,
}) => {
  let requestType = entityId ? 'single' : 'bulk'
  if (crudAction !== CRUD_ACTIONS.read) {
    requestType = 'single'
  }
  return `${apiHost}${apiPrefix}${requestType}/${modelEndpoint}${entityId || ''}`
}
const customGetEntityUrlWithMethod = (options) => {
  const url = customGetEntityUrl(options)
  if (crudAction === CRUD_ACTIONS.read || crudAction === CRUD_ACTIONS.delete) return url
  const {
    crudAction,
  } = options
  return {
    url,
    method: crudAction === CRUD_ACTIONS.update ? 'post' : 'put',
  }
}

const customTransformArrayResponse = (response) => ({
  data: response.data,
  count: response.data.length,
})

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
  customTestApi: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: CUSTOM_TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
  },
  customTestApiConfigured: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: CUSTOM_TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
    transformArrayResponse: customTransformArrayResponse,
    getEntityUrl: customGetEntityUrlWithMethod,
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
  customModel: {
    apiName: 'customTestApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Custom api model',
    defaults: {
      id: undefined,
      test: undefined,
    },
    pagination: false,
    getEntityUrl: customGetEntityUrl,
    transformArrayResponse: customTransformArrayResponse,
  },
  customModelSingleEntityResponse: {
    apiName: 'customTestApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Custom api model with configured single entity response',
    defaults: {
      id: undefined,
      test: undefined,
    },
    pagination: false,
    getEntityUrl: customGetEntityUrl,
    transformEntityResponse: (response) => ({
      data: response.data,
    }),
  },
  customModelConfigured: {
    apiName: 'customTestApiConfigured',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Custom api model',
    pagination: false,
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
  requestCustomFormId: {
    model: 'customModel',
    defaults: {
      test: undefined,
    },
  },
  requestCustomFormIdConfigured: {
    model: 'customModelConfigured',
    defaults: {
      test: undefined,
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
