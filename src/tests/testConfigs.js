import {
  initRestify,
  setRestifyStore,
} from '../init'

import api, { CRUD_ACTIONS, DEFAULT_API_NAME } from '../api'
import RestifyForeignKeysArray from '../api/models/RestifyForeignKeysArray'
import RestifyForeignKey from '../api/models/RestifyForeignKey'
import RestifyGenericForeignKey from '../api/models/RestifyGenericForeignKey'
import RestifyField from '../api/models/RestifyField'
import forms from '../forms'

import { createRestifyStore } from '~/helpers/tests'


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
  const {
    crudAction,
  } = options
  if (crudAction === CRUD_ACTIONS.read || crudAction === CRUD_ACTIONS.delete) return url
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
  [DEFAULT_API_NAME]: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
  },
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
  camelCaseTestApi: {
    getToken: () => TEST_TOKEN,
    apiHost: TEST_API_HOST,
    apiPrefix: TEST_API_PREFIX,
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
    useSnakeCase: false,
  },
}

export const modelsDefinitions = {
  testModel: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model',
    defaults: {
      id: undefined,
      test: new RestifyField({ verboseName: 'Test' }),
      notInForeignKey: undefined,
    },
  },
  testCacheModel: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model',
    defaults: {
      id: undefined,
      test: undefined,
      notInForeignKey: undefined,
    },
  },
  testChild1Model: {
    apiName: 'testApi',
    parent: 'testModel',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test child 1 model',
    defaults: {
      id: undefined,
      test: undefined,
    },
  },
  testChild2Model: {
    apiName: 'testApi',
    parent: ['testChild1Model', 'testModel'],
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test child 2 model',
    defaults: {
      id: undefined,
      test: undefined,
    },
  },
  testModelNested: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model nested',
    defaults: {
      id: undefined,
      test: new RestifyField({
        defaults: {
          nested: new RestifyField({ verboseName: 'Nested' }),
        },
        verboseName: 'Parent of the nested field',
      }),
    },
  },
  testModelNested2: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model nested 2',
    defaults: {
      id: undefined,
      test: {
        nested: undefined,
      },
      notNested: undefined,
    },
    pagination: false,
  },
  testModelNested3: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model nested 3',
    defaults: {
      id: undefined,
      test: new RestifyField({
        defaults: {
          foreignKey: new RestifyForeignKey('testModel'),
        },
      }),
    },
  },
  testModelNested4: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model nested 4',
    defaults: {
      id: undefined,
      test: {
        foreignKey: new RestifyForeignKey('testModel'),
      },
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
  testModelForClearData: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model for clear data',
    defaults: {
      id: undefined,
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
  testModelWithForeignKey3: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with foreign key 3',
    pagination: false,
    defaults: {
      id: undefined,
      foreignKeys: new RestifyForeignKeysArray('testModelWithForeignKey4'),
    },
  },
  testModelWithForeignKey4: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with foreign key 4',
    pagination: false,
    defaults: {
      id: undefined,
      test: undefined,
      singleForeignKey: new RestifyForeignKey('testModel'),
      notInArray: new RestifyForeignKeysArray('testModel'),
      notInForeignKey: undefined,
    },
  },
  testNestedModelWithForeignKey: {
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
      nestedRestifyField: new RestifyField({
        defaults: {
          singleForeignKey: new RestifyForeignKey('testModel'),
          moreNested: new RestifyField({
            defaults: {
              foreignKeysArray: new RestifyForeignKeysArray('testModel'),
            },
          }),
        },
      }),
      nestedSimpleObject: {
        singleForeignKey: new RestifyForeignKey('testModel'),
      },
    },
  },
  testModelWithoutRequests: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    allowIdRequests: false,
    name: 'Test model with without requests',
    defaults: {
      test: new RestifyField({ verboseName: 'One more test field' }),
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
      test: new RestifyField({ verboseName: 'Test field' }),
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
  genericModel: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with generic foreign key',
    defaults: {
      genericField: new RestifyGenericForeignKey(['testModel', 'testModelNested']),
    },
  },
  camelCaseTestModel: {
    apiName: 'camelCaseTestApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'CamelCase test model',
    defaults: {
      id: undefined,
      testCamelCase: undefined,
    },
  },
  testModelWithDeepNest1: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with deep nest 1',
    defaults: {
      id: undefined,
      nest1: new RestifyForeignKey('testModelWithDeepNest2'),
    },
  },
  testModelWithDeepNest2: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with deep nest 2',
    defaults: {
      id: undefined,
      nest2: new RestifyForeignKey('testModelWithDeepNest3'),
    },
  },
  testModelWithDeepNest3: {
    apiName: 'testApi',
    endpoint: TEST_MODEL_ENDPOINT,
    name: 'Test model with deep nest 3',
    defaults: {
      id: undefined,
      nest3: undefined,
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
  testDirtyForm: {
    model: 'testModel',
    defaults: {
      test: undefined,
      testDirty: undefined,
    },
    trackDirtyFields: true,
    submitOnlyDirtyFields: true,
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
    model: 'testNestedModelWithForeignKey',
    defaults: {
      test: undefined,
      singleForeignKey: undefined,
      notInArray: [],
      notInForeignKey: undefined,
      nestedRestifyField: {
        singleForeignKey: undefined,
      },
      nestedSimpleObject: {
        singleForeignKey: undefined,
      },
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
  genericTestForm: {
    model: 'genericModel',
    defaults: {
      id: undefined,
      genericField: undefined,
    },
    mapServerDataToIds: true,
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
