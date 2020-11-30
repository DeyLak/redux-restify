import forms from '../forms'
import api from '../api'

import { removePrivateFields } from '~/helpers/nestedObjects'

import EntityList from '../api/models/EntityList'
import RestifyForeignKeysArray from '../api/models/RestifyForeignKeysArray'
import RestifyForeignKey from '../api/models/RestifyForeignKey'
import { getSpecialIdWithQuery } from '../api/constants'

import { ROUTER_LOCATION_CHANGE_ACTION } from '../constants'

import {
  store,
  beforeEachFunc,
  TEST_API_HOST,
  TEST_API_PREFIX,
  TEST_MODEL_ENDPOINT,
  OTHER_TEST_API_PREFIX,
  MANY_FOREIGN_KEYS_COUNT,
  modelsDefinitions,
  responseHeaders,

  modelUrl,
  model2Url,
  customModelBulkUrl,
  customModelSingleUrl,
} from './testConfigs'


describe('api', () => {
  describe('basic', () => {
    beforeEach(() => beforeEachFunc())

    it('provides an EntityList object for each registered model', () => {
      const state = store.getState()
      const testEntities = api.selectors.entityManager.testModel.getEntities(state)
      expect(testEntities).toEqual(jasmine.any(EntityList))
    })

    it('can nest RestifyFields configs with defaults option', () => {
      const testData = [
        { id: 1, test: { nested: true } },
        { id: 2, test: { nested: false } },
      ]
      store.dispatch(api.actions.entityManager.testModelNested.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))
      const state = store.getState()
      const testEntities = api.selectors.entityManager.testModelNested.getEntities(state)
      const testArray = testEntities.getArray()
      expect(removePrivateFields(testArray)).toEqual(testData)
      const defaultObj = testEntities.getById(3)
      expect(defaultObj).toEqual({
        id: 3,
        $modelType: 'testModelNested',
        $loading: true,
      })
      expect(defaultObj.test).toEqual({
        nested: undefined,
      })
    })

    it('can update nested fields with nulls', () => {
      const testData1 = { id: 1, otherField: false, test: { nested: true } }
      const testData2 = { id: 1, otherField: null, test: { nested: null } }
      store.dispatch(api.actions.entityManager.testModelNested.updateById(
        1,
        testData1,
      ))
      let state = store.getState()
      let testEntities = api.selectors.entityManager.testModelNested.getEntities(state)
      let testModel = testEntities.getById(1)
      expect(removePrivateFields(testModel)).toEqual(testData1)

      store.dispatch(api.actions.entityManager.testModelNested.updateById(
        1,
        testData2,
      ))
      state = store.getState()
      testEntities = api.selectors.entityManager.testModelNested.getEntities(state)
      testModel = testEntities.getById(1)
      expect(removePrivateFields(testModel)).toEqual(testData2)
    })

    it('can nest RestifyFields configs with RestifyForeignKeysArray', () => {
      const state = store.getState()
      const testEntities = api.selectors.entityManager.testModelWithForeignKey.getEntities(state)
      const defaultObj = testEntities.getById(3)
      expect(defaultObj).toEqual({
        id: 3,
        $modelType: 'testModelWithForeignKey',
        $loading: true,
      })
      expect(defaultObj.notInArray).toEqual([])
      expect(defaultObj.notInArrayIds).toEqual([])
      expect(defaultObj.notInForeignKey).toEqual(undefined)
      expect(defaultObj.test).toEqual(undefined)
      expect(defaultObj.singleForeignKeyId).toEqual(undefined)
      expect(defaultObj.singleForeignKey).toEqual({
        id: undefined,
        $modelType: 'testModel',
        $loading: false,
        $error: false,
      })
      expect(defaultObj.singleForeignKey.test).toEqual(undefined)
      expect(defaultObj.singleForeignKey.notInForeignKey).toEqual(undefined)
    })

    it('clears pages after router location changes', () => {
      const testData = [{ id: 1, test: true }, { id: 2, test: false }]
      store.dispatch(api.actions.entityManager.testModel.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))
      let state = store.getState()
      const testArray = api.selectors.entityManager.testModel.getEntities(state).getArray()
      expect(removePrivateFields(testArray)).toEqual(testData)
      store.dispatch({
        type: ROUTER_LOCATION_CHANGE_ACTION,
        payload: {
          action: 'PUSH',
        },
      })
      state = store.getState()
      expect(state.api.entityManager.testModel.pages).toEqual({})
      expect(state.api.entityManager.testModel.singleEntities).not.toEqual({})
    })

    const modelsForNestedNormalizeTest = ['testModelNested3', 'testModelNested4']
    modelsForNestedNormalizeTest.forEach((modelName) => {
      it(`Stores normalized data for nested fields (${modelName})`, () => {
        const testData = [{
          id: 1,
          test: {
            foreignKey: {
              id: 1,
              test: true,
            },
          },
        }]
        const testGetArray = [{
          ...testData[0],
          test: {
            ...testData[0].test,
            foreignKeyId: 1,
            foreignKey: {
              ...testData[0].test.foreignKey,
              $modelType: 'testModel',
            },
          },
        }]
        store.dispatch(api.actions.entityManager[modelName].updateData(
          testData,
          1,
          2,
          {},
          undefined,
          {},
          false,
          {},
        ))
        const state = store.getState()
        const testArray = api.selectors.entityManager[modelName].getEntities(state).getArray()
        expect(removePrivateFields(testArray)).toEqual(testGetArray)
        expect(state.api.entityManager.testModel.singleEntities[1].actual).toEqual(testData[0].test.foreignKey)
        expect(state.api.entityManager[modelName].singleEntities[1].actual).toEqual({
          id: 1,
          test: {
            foreignKeyId: 1,
          },
        })
      })
    })

    it('Stores normalized data for deep nested fields', () => {
      const testData = [{
        id: 1,
        test: {
          foreignKey: {
            id: 1,
            test: true,
            singleForeignKey: {
              id: 1,
              test: true,
            },
          },
        },
      }]
      const testGetArray = [{
        ...testData[0],
        test: {
          ...testData[0].test,
          foreignKeyId: 1,
          foreignKey: {
            ...testData[0].test.foreignKey,
            singleForeignKeyId: 1,
            singleForeignKey: {
              ...testData[0].test.foreignKey.singleForeignKey,
              $modelType: 'testModel',
            },
            $modelType: 'testModelWithForeignKey',
          },
        },
      }]
      store.dispatch(api.actions.entityManager.testModelNested5.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))

      const state = store.getState()
      const testArray = api.selectors.entityManager.testModelNested5.getEntities(state).getArray()
      expect(removePrivateFields(testArray)).toEqual(testGetArray)

      expect(state.api.entityManager.testModel.singleEntities[1].actual).toEqual(
        testData[0].test.foreignKey.singleForeignKey,
      )
      expect(state.api.entityManager.testModelWithForeignKey.singleEntities[1].actual).toEqual({
        id: 1,
        test: true,
        singleForeignKeyId: 1,
      })
      expect(state.api.entityManager.testModelNested5.singleEntities[1].actual).toEqual({
        id: 1,
        test: {
          foreignKeyId: 1,
        },
      })
    })

    it('clears all data after router location changes', () => {
      const testData = [{ id: 1, test: true }, { id: 2, test: false }]
      store.dispatch(api.actions.entityManager.testModelOtherId.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))
      let state = store.getState()
      store.dispatch({
        type: ROUTER_LOCATION_CHANGE_ACTION,
        payload: {
          action: 'PUSH',
        },
      })
      state = store.getState()
      expect(state.api.entityManager.testModelOtherId.pages).toEqual({})
      expect(state.api.entityManager.testModelOtherId.singleEntities).toEqual({})
    })

    it('can clear pages with and without oldPages', () => {
      const testData = [{ id: 1, test: true }, { id: 2, test: false }]
      store.dispatch(api.actions.entityManager.testModelOtherId.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))
      let state = store.getState()

      store.dispatch(api.actions.entityManager.testModelOtherId.clearPages(false))
      state = store.getState()
      expect(state.api.entityManager.testModelOtherId.pages).toEqual({})
      expect(state.api.entityManager.testModelOtherId.oldPages).not.toEqual({})
      const entities = api.selectors.entityManager.testModelOtherId.getEntities(state)
      expect(entities.getArray().length).toEqual(testData.length)

      store.dispatch(api.actions.entityManager.testModelOtherId.clearPages())
      state = store.getState()
      expect(state.api.entityManager.testModelOtherId.pages).toEqual({})
      expect(state.api.entityManager.testModelOtherId.oldPages).toEqual({})
    })

    it('can clear data with and without oldSingleEntities', () => {
      const testData = [{ id: 1, test: true }, { id: 2, test: false }]
      store.dispatch(api.actions.entityManager.testModelForClearData.updateData(
        testData,
        1,
        2,
        {},
        undefined,
        {},
        false,
        {},
      ))
      let state = store.getState()

      store.dispatch(api.actions.entityManager.testModelForClearData.clearData(false))
      state = store.getState()
      expect(state.api.entityManager.testModelForClearData.pages).toEqual({})
      expect(state.api.entityManager.testModelForClearData.oldPages).toEqual({})
      expect(state.api.entityManager.testModelForClearData.singleEntities).toEqual({})
      expect(state.api.entityManager.testModelForClearData.oldSingleEntities).not.toEqual({})
      const entities = api.selectors.entityManager.testModelForClearData.getEntities(state)
      expect(entities.getById(1)).toEqual({
        ...testData[0],
        $modelType: 'testModelForClearData',
        $old: true,
      })

      store.dispatch(api.actions.entityManager.testModelForClearData.clearData())
      state = store.getState()
      expect(state.api.entityManager.testModelForClearData.singleEntities).toEqual({})
      expect(state.api.entityManager.testModelForClearData.oldSingleEntities).toEqual({})
    })

    it('can reset entity manager', () => {
      const testData = [{ id: 1, test: true }, { id: 2, test: false }]
      const testModels = ['testModel', 'testModelForClearData']
      testModels.forEach(model => {
        store.dispatch(api.actions.entityManager[model].updateData(
          testData,
          1,
          2,
          {},
          undefined,
          {},
          false,
          {},
        ))
      })

      let state = store.getState()

      testModels.forEach(model => {
        expect(state.api.entityManager[model].pages).not.toEqual({})
        expect(state.api.entityManager[model].oldPages).not.toEqual({})
        expect(state.api.entityManager[model].singleEntities).not.toEqual({})
      })

      store.dispatch(api.actions.resetEntityManager())
      state = store.getState()

      testModels.forEach(model => {
        expect(state.api.entityManager[model].pages).toEqual({})
        expect(state.api.entityManager[model].oldPages).toEqual({})
        expect(state.api.entityManager[model].singleEntities).toEqual({})
      })
    })

    it('can update single ids data in entity manager with custom model config', () => {
      const testData = {
        results: {
          testModel: { id: 1, test: true },
          customModel: [
            { id: 1, test: false },
            { id: 2, test: false },
          ],
        },
      }
      const testModels = ['testModel', 'customModel']
      const testConfig = {
        defaults: {
          results: {
            testModel: new RestifyForeignKey('testModel'),
            customModel: new RestifyForeignKeysArray('customModel'),
          },
        },
      }
      store.dispatch(api.actions.updateEntityManagerData(testData, testConfig))

      const state = store.getState()
      const savedModel = api.selectors.entityManager.testModel.getEntities(state).getById(1)

      expect(savedModel).toEqual({
        ...testData.results.testModel,
        $modelType: 'testModel',
      })
      testModels.forEach(model => {
        const objectsCount = Object.keys(state.api.entityManager[model].singleEntities).length
        expect(objectsCount).toEqual(testData.results[model].length || 1)
      })
    })

    it('can update arrays with api configs data in entity manager with custom model config', () => {
      const testData = {
        results: {
          testModel1: [
            { id: 1, test: true },
            { id: 2, test: false },
          ],
          testModel2: {
            count: 3,
            results: [
              { id: 3, test: true },
              { id: 4, test: false },
            ],
          },
        },
      }
      const testApiConfig = {
        filter: {
          field: 0,
        },
      }
      const testConfig = {
        defaults: {
          results: {
            testModel1: new RestifyForeignKeysArray('testModel', { withPages: true }),
            testModel2: new RestifyForeignKeysArray('testModel', {
              withPages: true,
              apiConfig: testApiConfig,
              transformField: (data) => ({
                data: data.results,
                count: data.count,
              }),
            }),
          },
        },
      }
      store.dispatch(api.actions.updateEntityManagerData(testData, testConfig))

      const state = store.getState()
      expect(Object.keys(state.api.entityManager.testModel.pages).length).toEqual(2)

      const savedModel = api.selectors.entityManager.testModel.getEntities(state).getById(1)
      expect(savedModel).toEqual({
        ...testData.results.testModel1[0],
        $modelType: 'testModel',
      })

      const savedArray1 = api.selectors.entityManager.testModel.getEntities(state).getArray()
      expect(savedArray1).toEqual(testData.results.testModel1.map(item => ({
        ...item,
        $modelType: 'testModel',
      })))

      const savedArray2 = api.selectors.entityManager.testModel.getEntities(state).getArray(testApiConfig)
      expect(savedArray2).toEqual(testData.results.testModel2.results.map(item => ({
        ...item,
        $modelType: 'testModel',
      })))
    })

    it('can update arrays with pagination in entity manager with custom model config', () => {
      const testData = [
        {
          results: {
            count: 3,
            results: [
              { id: 1, test: true },
              { id: 2, test: false },
            ],
          },
        },
        {
          results: {
            count: 3,
            results: [
              { id: 3, test: true },
            ],
          },
        },
      ]

      testData.forEach((currentTestData, dataIndex) => {
        const testConfig = {
          defaults: {
            results: new RestifyForeignKeysArray('testModel', {
              withPages: true,
              transformField: (data) => ({
                data: data.results,
                count: data.count,
                page: dataIndex + 1,
              }),
            }),
          },
        }
        store.dispatch(api.actions.updateEntityManagerData(currentTestData, testConfig))

        const state = store.getState()
        expect(Object.keys(state.api.entityManager.testModel.pages).length).toEqual(1)

        const array = api.selectors.entityManager.testModel.getEntities(state).getArray()
        expect(array).toEqual(testData.slice(0, dataIndex + 1).flatMap(dataItem => {
          return dataItem.results.results.map(item => ({
            ...item,
            $modelType: 'testModel',
          }))
        }))
      })
    })

    it('returns endpoint', () => {
      const endpoint = api.selectors.entityManager.testModel.getEndpoint()
      expect(endpoint).toEqual({
        apiHost: TEST_API_HOST,
        apiPrefix: TEST_API_PREFIX,
        endpoint: TEST_MODEL_ENDPOINT,
      })
    })
  })

  const testServerArrayResponse = {
    count: 3,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        test: true,
      },
      {
        id: 2,
        test: true,
      },
      {
        id: 3,
        test: true,
      },
    ],
  }

  const testGenericServerArrayResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        genericField: {
          _object: 'testModel',
          id: 1,
          test: true,
        },
      },
      {
        id: 2,
        genericField: {
          _object: 'testModelNested',
          id: 1,
          test: {
            nested: true,
          },
        },
      },
    ],
  }

  const testServerArrayRestifyModels = testServerArrayResponse.results.map(item => ({
    ...item,
    $modelType: 'testModel',
  }))

  const testServerArrayCachedRestifyModels = testServerArrayResponse.results.map(item => ({
    ...item,
    $modelType: 'testCacheModel',
  }))

  const testServerArrayRestifyChild1Models = testServerArrayResponse.results.map(item => ({
    ...item,
    $modelType: 'testChild1Model',
  }))

  const testServerArrayRestifyChild2Models = testServerArrayResponse.results.map(item => ({
    ...item,
    $modelType: 'testChild2Model',
  }))

  const testServerArrayRestifyChild3Models = testServerArrayResponse.results.map(item => ({
    ...item,
    $modelType: 'testChild3Model',
  }))

  const testGenericServerArrayRestifyModels = testGenericServerArrayResponse.results.map(item => ({
    ...item,
    genericFieldId: item.genericField.id,
    // eslint-disable-next-line no-underscore-dangle
    genericFieldType: item.genericField._object,
    genericField: {
      id: item.genericField.id,
      test: item.genericField.test,
      // eslint-disable-next-line no-underscore-dangle
      $modelType: item.genericField._object,
    },
    $modelType: 'genericModel',
  }))

  const defaultUrl = `${modelUrl}?page=1&page_size=10`
  const mockRequest = (response = testServerArrayResponse, {
    url = defaultUrl,
  } = {}) => {
    jasmine.Ajax.stubRequest(url).andReturn({
      status: 200,
      responseText: JSON.stringify(response),
      responseHeaders,
    })
  }
  describe('Server interactions', () => {
    beforeEach(() => {
      beforeEachFunc()
      jasmine.Ajax.install()
    })

    afterEach(() => {
      jasmine.Ajax.uninstall()
    })

    it(`initializes a background server request for array and returns empty array for unloaded one,
      but doesn't make another request for same config`, (done) => {
      mockRequest()
      let currentArray = []
      const interval = setInterval(() => {
        const state = store.getState()
        currentArray = api.selectors.entityManager.testModel.getEntities(state).getArray()
        if (currentArray.length > 0) {
          clearInterval(interval)
          expect(currentArray).toEqual(testServerArrayRestifyModels)
          done()
        } else {
          expect(currentArray).toEqual([])
        }
      }, 0)
    })

    it('Can load array with custom page size synchronously', (done) => {
      const maxItems = 2
      const serverResponse = {
        ...testServerArrayResponse,
        count: maxItems,
        results: testServerArrayResponse.results.slice(0, maxItems - 1),
      }
      mockRequest(serverResponse, {
        url: `${modelUrl}?page=1&page_size=${maxItems}`,
      })
      let currentArray = []
      const interval = setInterval(() => {
        const state = store.getState()
        currentArray = api.selectors.entityManager.testModel.getEntities(state).getArray({
          modelConfig: {
            pageSize: maxItems,
          },
        })
        if (currentArray.length > 0) {
          clearInterval(interval)
          expect(currentArray).toEqual(testServerArrayRestifyModels.slice(0, maxItems - 1))
          done()
        } else {
          expect(currentArray).toEqual([])
        }
      }, 0)
    })

    const clearDataConfigs = [
      {
        withClearData: true,
        modelType: 'testModelWithForeignKey5',
      },
      {
        withClearData: false,
        modelType: 'testModelWithForeignKey6',
      },
    ]
    clearDataConfigs.forEach(({
      withClearData,
      modelType,
    }) => {
      const name = withClearData
        ? 'Stores an error response and clear it after clearData() called'
        : 'Stores an error response for request and doesn\'t make other requests'
      it(name, (done) => {
        const CYCLES_TO_RUN = 10
        let apiCallsCounter = 0
        let cyclesRunCounter = 0
        const stubRequest = () => jasmine.Ajax.stubRequest(`${modelUrl}1/`).andCallFunction((stub) => {
          apiCallsCounter += 1
          stub.andReturn({
            status: 403,
            responseText: '',
            responseHeaders,
          })
        })
        const interval = setInterval(() => {
          stubRequest()
          const state = store.getState()
          const entities = api.selectors.entityManager[modelType].getEntities(state)

          const model = entities.getById(1)
          // Corner case, when we get model in 2 places and use async getters,
          // Check for bug with race condition in event loop between micro and macro tasks
          if (!withClearData && (entities.idLoaded[1] instanceof Promise)) {
            entities.idLoaded[1].then(() => {
              expect(model.singleForeignKey).toEqual({
                id: undefined,
                $modelType: 'testModel',
                $error: false,
                $loading: false,
              })
            })
          }
          if (model.$loading) {
            expect(model).toEqual({
              id: 1,
              $modelType: modelType,
              $loading: true,
            })
          } else {
            expect(model).toEqual({
              id: 1,
              $modelType: modelType,
              $error: true,
              $loading: false,
            })
            expect(model.singleForeignKey).toEqual({
              id: undefined,
              $modelType: 'testModel',
              $error: false,
              $loading: false,
            })
          }
          if (withClearData) {
            // Inner properties should also be cleared
            store.dispatch(api.actions.entityManager[modelType].clearData())
            expect(entities.noPaginationArraysLoadingMap).toEqual({})
            expect(entities.arraysLoadingMap).toEqual({})
            expect(entities.errorsLoaded).toEqual({})
            expect(entities.idLoaded).toEqual({})
          }

          cyclesRunCounter += 1
          if (cyclesRunCounter > CYCLES_TO_RUN) {
            clearInterval(interval)
            if (withClearData) {
              expect(apiCallsCounter).not.toEqual(1)
            } else {
              expect(apiCallsCounter).toEqual(1)
            }
            done()
          }
        }, 0)
      })
    })

    it('can get a model array asynchronously', (done) => {
      mockRequest()
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray()
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyModels)
          done()
        })
    })

    it('can get a child model synchronously by empty id on first parent level', (done) => {
      mockRequest(testServerArrayResponse.results[0], {
        url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}`,
      })
      let currentModel = {}
      const modelResponse = testServerArrayRestifyChild1Models[0]
      const checkModel = () => {
        const state = store.getState()
        currentModel = api.selectors.entityManager.testChild1Model.getEntities(state).getById('', {
          parentEntities: {
            testModel: 1,
          },
        })
        if (currentModel.test === modelResponse.test) {
          expect(currentModel).toEqual(modelResponse)
          done()
        } else {
          setTimeout(checkModel, 0)
        }
      }
      setTimeout(checkModel, 0)
      checkModel()
    })

    it('can get a model asynchronously and check if it is loaded', (done) => {
      mockRequest(testServerArrayResponse.results[0], { url: `${modelUrl}1/` })
      let state = store.getState()
      let testModelEntities = api.selectors.entityManager.testModel.getEntities(state)
      expect(testModelEntities.hasById(1)).toEqual(false)
      testModelEntities.asyncGetById(1)
        .then(model => {
          expect(model).toEqual(testServerArrayRestifyModels[0])
          state = store.getState()
          testModelEntities = api.selectors.entityManager.testModel.getEntities(state)
          expect(testModelEntities.hasById(1)).toEqual(true)
          done()
        })
    })

    it('can get a single foreign key model asynchronously with many foreign keys', (done) => {
      const testData = {
        id: 1,
        dict: (new Array(MANY_FOREIGN_KEYS_COUNT)).fill(0).reduce((memo, item, index) => ({
          ...memo,
          [`key${index}`]: [{ id: index + 1, test: true }],
        }), {}),
      }
      const restifyModelData = {
        ...testData,
        dict: Object.entries(testData.dict).reduce((memo, [key, model]) => ({
          ...memo,
          [`${key}Ids`]: model.map(item => item.id),
          [key]: model.map(item => ({
            ...item,
            $modelType: 'testModel',
          })),
        }), {}),
        $modelType: 'testModelWithManyForeignKeys',
      }
      mockRequest(testData, { url: `${modelUrl}1/` })
      const state = store.getState()
      api.selectors.entityManager.testModelWithManyForeignKeys.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model).toEqual(restifyModelData)
          done()
        })
    })

    it('can get a nested model asynchronously with many foreign keys', (done) => {
      const testData = {
        id: 1,
        dict: (new Array(MANY_FOREIGN_KEYS_COUNT)).fill(0).reduce((memo, item, index) => {
          const currentId = index + 1
          return {
            ...memo,
            [`key${index}`]: [{
              id: currentId,
              test: true,
              singleForeignKey: {
                id: currentId,
                test: true,
              },
            }],
          }
        }, {}),
      }
      const restifyModelData = {
        ...testData,
        dict: Object.entries(testData.dict).reduce((memo, [key, model]) => ({
          ...memo,
          [`${key}Ids`]: model.map(item => item.id),
          [key]: model.map(item => ({
            ...item,
            singleForeignKeyId: item.singleForeignKey.id,
            singleForeignKey: {
              ...item.singleForeignKey,
              $modelType: 'testModel',
            },
            $modelType: 'testModelWithForeignKey',
          })),
        }), {}),
        $modelType: 'testNestedModelWithManyForeignKeys',
      }
      mockRequest(testData, { url: `${modelUrl}1/` })
      const state = store.getState()
      api.selectors.entityManager.testNestedModelWithManyForeignKeys.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model).toEqual(restifyModelData)
          done()
        })
    })

    it('can get a child model asynchronously by id on first parent level', (done) => {
      mockRequest(testServerArrayResponse.results[0], {
        url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}1/`,
      })
      const state = store.getState()
      api.selectors.entityManager.testChild1Model.getEntities(state).asyncGetById(1, {
        parentEntities: {
          testModel: 1,
        },
      })
        .then(model => {
          expect(model).toEqual(testServerArrayRestifyChild1Models[0])
          done()
        })
    })

    it('can get an unregistered child model asynchronously by id on first parent level', (done) => {
      const ungeristeredModelEndpoint = 'unregistered-model'
      mockRequest(testServerArrayResponse.results[0], {
        url: `${TEST_API_HOST}${TEST_API_PREFIX}${ungeristeredModelEndpoint}/1/${TEST_MODEL_ENDPOINT}1/`,
      })
      const state = store.getState()
      api.selectors.entityManager.testChildUnregisteredModel.getEntities(state).asyncGetById(1, {
        parentEntities: {
          [ungeristeredModelEndpoint]: 1,
        },
      })
        .then(model => {
          expect(model).toEqual({
            ...testServerArrayRestifyChild1Models[0],
            $modelType: 'testChildUnregisteredModel',
          })
          done()
        })
    })

    it('can get a child model array asynchronously on first parent level', (done) => {
      mockRequest(testServerArrayResponse, {
        url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}?page=1&page_size=10`,
      })
      const state = store.getState()
      api.selectors.entityManager.testChild1Model.getEntities(state).asyncGetArray({
        parentEntities: {
          testModel: 1,
        },
      })
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyChild1Models)
          done()
        })
    })

    it('can get a child model array asynchronously on second parent level', (done) => {
      const makeMock = () => mockRequest(testServerArrayResponse, {
        url: `${model2Url}1/${TEST_MODEL_ENDPOINT}1/${TEST_MODEL_ENDPOINT}?page=1&page_size=10`,
      })
      makeMock()
      let state = store.getState()
      const apiConfig = {
        parentEntities: {
          testModel: 1,
          testOtherEndpointModel: 1,
        },
      }
      api.selectors.entityManager.testChild3Model.getEntities(state).asyncGetArray(apiConfig)
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyChild3Models)
          store.dispatch(api.actions.entityManager.testChild3Model.clearData(false))

          makeMock()
          state = store.getState()
          // Check second time for bug with different parents order
          api.selectors.entityManager.testChild3Model.getEntities(state).asyncGetArray(apiConfig)
            .then(arr => {
              expect(arr).toEqual(testServerArrayRestifyChild3Models)
              done()
            })
        })
    })

    it('can get a child model array asynchronously on first parent level without second one', (done) => {
      mockRequest(testServerArrayResponse, {
        url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}?page=1&page_size=10`,
      })
      const state = store.getState()
      api.selectors.entityManager.testChild2Model.getEntities(state).asyncGetArray({
        parentEntities: {
          testModel: 1,
        },
      })
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyChild2Models)
          done()
        })
    })

    it('can store same child model ids for different parentEntities', (done) => {
      mockRequest(testServerArrayResponse.results[0], {
        url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}1/`,
      })
      let state = store.getState()
      const apiConfig = {
        parentEntities: {
          testModel: 1,
        },
      }
      const apiConfig2 = {
        parentEntities: {
          testChild1Model: 1,
        },
      }
      api.selectors.entityManager.testChild2Model.getEntities(state).asyncGetById(1, apiConfig)
        .then(model => {
          expect(model).toEqual(testServerArrayRestifyChild2Models[0])
          const currentEntitiesState = store.getState().api.entityManager.testChild2Model.singleEntities
          const expectedId = getSpecialIdWithQuery(1, undefined, apiConfig.parentEntities)
          expect(Object.keys(currentEntitiesState)).toEqual([expectedId])
          state = store.getState()
          const syncModel = api.selectors.entityManager.testChild2Model.getEntities(state).getById(1, apiConfig)
          expect(syncModel).toEqual(testServerArrayRestifyChild2Models[0])

          mockRequest(testServerArrayResponse.results[0], {
            url: `${modelUrl}1/${TEST_MODEL_ENDPOINT}1/`,
          })
          const notInStoreModel = api.selectors.entityManager.testChild2Model.getEntities(state).getById(1, apiConfig2)
          expect(notInStoreModel.$loading).toBe(true)
          api.selectors.entityManager.testChild2Model.getEntities(state).asyncGetById(1, apiConfig2)
            .then(newModel => {
              expect(newModel).toEqual(testServerArrayRestifyChild2Models[0])
              done()
            })
        })
    })

    it('can get a camelCase model array asynchronously', (done) => {
      mockRequest(testServerArrayResponse, {
        url: `${modelUrl}?camelCaseParam=1&page=1&pageSize=10`,
      })
      const state = store.getState()
      api.selectors.entityManager.camelCaseTestModel.getEntities(state).asyncGetArray({
        filter: {
          camelCaseParam: 1,
        },
      }).then(() => {
        done()
      })
    })

    it('can get a model array with custom pageSize asynchronously', (done) => {
      const maxItems = 2
      const serverResponse = {
        ...testServerArrayResponse,
        count: maxItems,
        results: testServerArrayResponse.results.slice(0, maxItems - 1),
      }
      mockRequest(serverResponse, {
        url: `${modelUrl}?page=1&page_size=${maxItems}`,
      })
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray({
        modelConfig: {
          pageSize: maxItems,
        },
      })
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyModels.slice(0, maxItems - 1))
          done()
        })
    })

    it('can cache old pages, while navigating between routes', (done) => {
      mockRequest(testServerArrayResponse, {
        url: `${modelUrl}?page=1&page_size=10`,
      })
      let state = store.getState()
      api.selectors.entityManager.testCacheModel.getEntities(state).asyncGetArray()
        .then(array => {
          expect(array).toEqual(testServerArrayCachedRestifyModels)
          store.dispatch({
            type: ROUTER_LOCATION_CHANGE_ACTION,
            payload: {
              actions: 'PUSH',
            },
          })
          state = store.getState()
          const cachedArray = api.selectors.entityManager.testCacheModel.getEntities(state).getArray()
          expect(cachedArray).toEqual(testServerArrayCachedRestifyModels)
          done()
        })
    })

    it('can store generic relations', (done) => {
      mockRequest(testGenericServerArrayResponse)
      const state = store.getState()
      api.selectors.entityManager.genericModel.getEntities(state).asyncGetArray()
        .then(array => {
          expect(array).toEqual(testGenericServerArrayRestifyModels)
          done()
        })
    })

    it('can get a model array with custom model config', (done) => {
      const customEndpoint = 'absolutely-custom/'
      mockRequest(testServerArrayResponse.results, {
        url: `${TEST_API_HOST}${TEST_API_PREFIX}${customEndpoint}`,
      })
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray({
        modelConfig: {
          endpoint: customEndpoint,
          pagination: false,
        },
      })
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyModels)
          done()
        })
    })

    it('Throws an error for bad set pagination property', (done) => {
      mockRequest(testServerArrayResponse.results)
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray()
        .then(() => {
          done.fail('Expected to throw erorr on map function')
        })
        .catch((e) => {
          expect(e.message).toMatch(/testModel/)
          done()
        })
    })

    const modelResponse = {
      id: 1,
      test: true,
      notInForeignKey: true,
    }

    const modelResponseIdOnly = {
      id: 1,
    }

    const modelForeignKeyResponseWithNull = {
      id: 1,
      test: true,
      singleForeignKey: null,
    }

    const modelForeignKeyResponseWithNullArray = [
      modelForeignKeyResponseWithNull,
    ]

    const modelResponseWithNull = {
      id: 1,
      test: true,
      notInForeignKey: null,
    }

    const modelResponseWithNullArray = [
      modelResponseWithNull,
    ]

    const modelWithForeignKeyResponse = {
      id: 1,
      test: true,
      notInForeignKey: true,
      notInArray: testServerArrayResponse.results,
    }

    const modelNested2Response = {
      id: 1,
      test: {
        nested: true,
      },
      notNested: true,
    }

    const modelNested2ArrayResponse = [{
      id: 1,
      notNested: true,
    }]

    const modelWithForeignKeyArrayResponse = [{
      id: 1,
      test: true,
    }]

    const modelWithForeignKeyResponseWithNull = {
      id: 1,
      test: true,
      notInForeignKey: true,
      singleForeignKey: null,
      notInArray: testServerArrayResponse.results,
      nestedRestifyField: {
        singleForeignKey: { ...modelResponse },
        moreNested: {
          foreignKeysArray: testServerArrayResponse.results,
        },
      },
      nestedSimpleObject: {
        singleForeignKey: { ...modelResponse },
      },
    }

    const modelGenericResponse = {
      id: 1,
      genericField: {
        _object: 'testModel',
        id: 1,
        test: true,
        notInForeignKey: false,
      },
    }

    const modelWithForeignKeyResponseId2 = {
      ...modelWithForeignKeyResponse,
      id: 2,
    }

    const modelWithForeignKey2Response = {
      id: 1,
      foreignKeys: [
        {
          id: 1,
          test: false,
        },
        {
          id: 2,
          test: true,
        },
      ],
    }

    const modelWithForeignKey2PrimitiveKeysResponse = {
      id: 2,
      foreignKeys: [1, 2],
    }
    const modelWithForeignKeyRestifyModel = {
      ...modelWithForeignKeyResponse,
      notInArray: modelWithForeignKeyResponse.notInArray.map(item => ({
        ...item,
        $modelType: 'testModel',
      })),
      notInArrayIds: testServerArrayResponse.results.map(item => item.id),
    }
    const modelWithForeignKeyRestifyModelId2 = {
      ...modelWithForeignKeyResponseId2,
      notInArrayIds: testServerArrayResponse.results.map(item => item.id),
    }

    const modelWithForeignKeyResponse2 = {
      ...modelWithForeignKeyRestifyModel,
      test: false,
    }
    const configs = [
      {},
      { forceLoad: true },
      { asyncGetters: false },
      { asyncGetters: true },
    ]

    configs.forEach(config => {
      it('can get a model asynchronously and then receive array without rewriting missing fields', (done) => {
        mockRequest(modelWithForeignKeyResponse, { url: `${modelUrl}1/` })
        let state = store.getState()
        api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1, config)
          .then(model => {
            expect(model).toEqual({
              ...modelWithForeignKeyRestifyModel,
              $modelType: 'testModelWithForeignKey',
            })
            mockRequest([modelWithForeignKeyArrayResponse], {
              url: modelUrl,
            })
            state = store.getState()
            api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetArray().then(() => {
              state = store.getState()
              const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
              expect(currentEntity).toEqual({
                ...modelWithForeignKeyRestifyModel,
                $modelType: 'testModelWithForeignKey',
              })
              done()
            })
          })
      })

      it('can get an array without some fields, and then get those fields by id', (done) => {
        let state = store.getState()
        mockRequest([modelWithForeignKeyArrayResponse], {
          url: modelUrl,
        })
        api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetArray().then(() => {
          mockRequest(modelWithForeignKeyResponse, { url: `${modelUrl}1/` })
          state = store.getState()
          api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1, config)
            .then(async model => {
              const fieldValue = await model.notInForeignKey
              expect(fieldValue).toEqual(modelWithForeignKeyRestifyModel.notInForeignKey)
              done()
            })
        })
      })
    })

    const configs2 = [
      { forceLoad: true },
      { asyncGetters: true },
    ]

    const modelWithDeepNest1Response = {
      id: 1,
      nest1: 1,
    }
    const modelWithDeepNest2Response = {
      id: 1,
      nest2: 1,
    }
    const modelWithDeepNest3Response = {
      id: 1,
      nest3: true,
    }
    configs2.forEach(config => {
      it(
        `can get a an array, and then get model asynchronously with nested object: ${JSON.stringify(config)}`,
        (done) => {
          mockRequest(modelNested2ArrayResponse, { url: modelUrl })
          let state = store.getState()
          api.selectors.entityManager.testModelNested2.getEntities(state).asyncGetArray().then(async (array) => {
            expect(array).toEqual(modelNested2ArrayResponse.map(model => ({
              ...model,
              $modelType: 'testModelNested2',
            })))
            // Create a race condition between getting async property and recieving object by id.
            let firstPromise = Promise.resolve()
            if (config.asyncGetters) {
              mockRequest(modelNested2Response, { url: `${modelUrl}1/` })
              state = store.getState()
              const model = api.selectors.entityManager.testModelNested2.getEntities(state).getById(1, config)
              firstPromise = model.test.then(testValue => {
                expect(testValue).toEqual(modelNested2Response.test)
              })
            }
            state = store.getState()
            mockRequest(modelNested2Response, { url: `${modelUrl}1/` })
            const secondPromise = api.selectors.entityManager.testModelNested2.getEntities(state).asyncGetById(1, {
              ...config,
              forceLoad: true,
            })
              .then(model => {
                expect(model).toEqual({
                  ...modelNested2Response,
                  $modelType: 'testModelNested2',
                })
              })

            Promise.all([
              firstPromise,
              secondPromise,
            ]).then(() => done())
          })
        },
      )

      it('can get an array without some fields, and then use async getters to get nested objects', (done) => {
        const state = store.getState()
        const deepModelUrl = `${modelUrl}1/`
        mockRequest(modelWithDeepNest1Response, { url: deepModelUrl })
        api.selectors.entityManager.testModelWithDeepNest1.getEntities(state).asyncGetById(1, config)
          .then(async model => {
            mockRequest(modelWithDeepNest2Response, { url: deepModelUrl })
            const nest1 = await model.nest1
            mockRequest(modelWithDeepNest3Response, { url: deepModelUrl })
            const nest2 = await nest1.nest2
            // TODO by @deylak this should not be promise, cause we have this data already
            const nest3 = await nest2.nest3
            expect(nest3).toEqual(true)
            done()
          })
      })
    })

    it('can get a model asynchronously and then receive this model in foreign key without rewriting fields', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelWithForeignKeyResponse, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model).toEqual({
            ...modelWithForeignKeyRestifyModel,
            $modelType: 'testModelWithForeignKey',
          })
          mockRequest(modelWithForeignKey2Response, { url: idUrl })
          api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).asyncGetById(1)
            .then((newModel) => {
              expect(newModel.foreignKeys[0]).toEqual({
                ...modelWithForeignKeyResponse2,
                // This is foreign key
                $modelType: 'testModelWithForeignKey',
              })
              state = store.getState()
              const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
              expect(currentEntity).toEqual({
                ...modelWithForeignKeyResponse2,
                $modelType: 'testModelWithForeignKey',
              })
              expect(currentEntity.notInForeignKey).toBe(true)
              done()
            })
        })
    })

    it('can get a model asynchronously without some keys, and then get them by auto request', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelWithForeignKey2Response, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).asyncGetById(1)
        .then(() => {
          state = store.getState()
          let currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
          expect(currentEntity).toEqual({
            ...modelWithForeignKey2Response.foreignKeys[0],
            $modelType: 'testModelWithForeignKey',
          })

          mockRequest(modelWithForeignKeyResponse, { url: idUrl })
          const interval = setInterval(() => {
            state = store.getState()
            currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
            if (currentEntity.notInArray.length > 0) {
              clearInterval(interval)
              expect(currentEntity).toEqual({
                ...modelWithForeignKeyRestifyModel,
                $modelType: 'testModelWithForeignKey',
              })
              done()
            } else {
              expect(currentEntity.notInArray).toEqual([])
            }
          }, 0)
        })
    })

    it('can get a model asynchronously without some keys, and don\t get them after get by id request', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelResponseIdOnly, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1)
        .then(() => {
          const request = jasmine.Ajax.requests.mostRecent()
          state = store.getState()
          const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)

          mockRequest(modelWithForeignKeyResponse, { url: idUrl })
          const nullFieldValue = currentEntity.singleForeignKey
          expect(nullFieldValue).not.toBe(null)
          setTimeout(() => {
            const newRequest = jasmine.Ajax.requests.mostRecent()
            expect(request).toBe(newRequest)
            done()
          }, 1)
        })
    })

    it('can get a model asynchronously with null foreign key and don\t make request for it again', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelForeignKeyResponseWithNullArray, { url: modelUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetArray()
        .then(() => {
          const request = jasmine.Ajax.requests.mostRecent()
          state = store.getState()
          const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)

          mockRequest(modelWithForeignKeyResponse, { url: idUrl })
          const nullFieldValue = currentEntity.singleForeignKey
          expect(nullFieldValue).toBe(null)
          setTimeout(() => {
            const newRequest = jasmine.Ajax.requests.mostRecent()
            expect(request).toBe(newRequest)
            done()
          }, 1)
        })
    })

    it('can get a model asynchronously with null key and don\t make request for it again', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelResponseWithNullArray, { url: modelUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetArray()
        .then(() => {
          const request = jasmine.Ajax.requests.mostRecent()
          state = store.getState()
          const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
          expect(currentEntity).toEqual({
            ...modelResponseWithNull,
            $modelType: 'testModelWithForeignKey',
          })

          mockRequest(modelWithForeignKeyResponse, { url: idUrl })
          const nullFieldValue = currentEntity.notInForeignKey
          expect(nullFieldValue).toBe(null)
          setTimeout(() => {
            const newRequest = jasmine.Ajax.requests.mostRecent()
            expect(request).toBe(newRequest)
            done()
          }, 1)
        })
    })

    it('can get a model asynchronously with foreign keys as primitive ids and use them for auto-request', (done) => {
      const idUrl = `${modelUrl}2/`
      mockRequest(modelWithForeignKey2PrimitiveKeysResponse, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey3.getEntities(state).asyncGetById(2)
        .then(() => {
          mockRequest(modelWithForeignKeyResponseId2, { url: idUrl })
          const interval = setInterval(() => {
            state = store.getState()
            const currentModel = api.selectors.entityManager.testModelWithForeignKey3.getEntities(state).getById(2)
            expect(currentModel.foreignKeys.length).toBe(2)
            const currentLazyEntity = currentModel.foreignKeys[1]

            if (currentLazyEntity.test !== undefined && !currentLazyEntity.$loading) {
              clearInterval(interval)
              expect(currentLazyEntity).toEqual({
                ...modelWithForeignKeyRestifyModelId2,
                notInArray: modelWithForeignKeyRestifyModelId2.notInArray.map(item => ({
                  ...item,
                  $modelType: 'testModel',
                })),
                $modelType: 'testModelWithForeignKey4',
              })
              done()
            }
          }, 0)
        })
    })

    it('can get a default model with default fields for arrays, while loading it', () => {
      const state = store.getState()
      const currentEntity = api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).getById(1)
      expect(currentEntity.foreignKeys).toEqual([])
    })

    it('Prevent id requests for entities with allowIdRequest === true', (done) => {
      spyOn(console, 'warn') // Test will produce warning, but we don't wont to read it
      const idUrl = `${modelUrl}1/`
      mockRequest(modelResponse, { idUrl })
      const state = store.getState()
      api.selectors.entityManager.testModelWithoutRequests.getEntities(state).asyncGetById(1).then(() => {
        const request = jasmine.Ajax.requests.mostRecent()
        expect(request).toBe(undefined)
        done()
      })
    })

    const customUrls = [
      'custom-url',
      'custom-url/',
    ]
    const urls = [
      `${TEST_API_HOST}${TEST_API_PREFIX}${customUrls[0]}/`,
      `${TEST_API_HOST}${OTHER_TEST_API_PREFIX}${customUrls[0]}/`,
    ]
    const apiNames = [
      'testApi',
      'otherTestApi',
    ]
    customUrls.forEach(customUrl => {
      urls.forEach((url, index) => {
        it('can get a model by special url and custom api name', (done) => {
          mockRequest(modelResponse, { url })
          let state = store.getState()
          api.selectors.entityManager.testModel.getEntities(state)
            .asyncGetByUrl(customUrl, { apiName: apiNames[index] })
            .then((object) => {
              expect(object).toEqual({
                ...modelResponse,
                $modelType: 'testModel',
              })
              state = store.getState()
              const recievedObject = api.selectors.entityManager.testModel.getEntities(state)
                .getByUrl(customUrl, { apiName: apiNames[index] })
              expect(recievedObject).toEqual({
                ...modelResponse,
                $modelType: 'testModel',
              })
              done()
            })
        })
      })
    })

    it('can get a special model by empty id', (done) => {
      mockRequest(modelResponse, { url: modelUrl })
      let currentModel = {}
      const interval = setInterval(() => {
        const state = store.getState()
        currentModel = api.selectors.entityManager.testModel.getEntities(state).getById('')
        if (currentModel.test === modelResponse.test) {
          expect(currentModel).toEqual({
            ...modelResponse,
            $modelType: 'testModel',
          })
          clearInterval(interval)
          done()
        }
      }, 0)
    })

    it('doesn\'t make a request for undefined id', (done) => {
      mockRequest(modelResponse, { url: `${modelUrl}/undefined/` })
      const state = store.getState()
      const entity = api.selectors.entityManager.testModel.getEntities(state).getById(undefined, { forceLoad: true })
      expect(entity.$error).toBe(false)
      expect(entity.$loading).toBe(false)

      api.selectors.entityManager.testModel.getEntities(state).asyncGetById(undefined, { forceLoad: true })
        .then(model => {
          const request = jasmine.Ajax.requests.mostRecent()
          expect(request).toBe(undefined)
          expect(model).toBe(undefined)
          done()
        })
    })

    const camelCaseModelResponse = {
      id: 1,
      testCamelCase: true,
    }

    it('can get a model for camelCase api', (done) => {
      mockRequest(camelCaseModelResponse, { url: `${modelUrl}1/?camelCaseParam=1` })
      const state = store.getState()
      api.selectors.entityManager.camelCaseTestModel.getEntities(state).asyncGetById(1, { query: {
        camelCaseParam: 1,
      } }).then((model) => {
        expect(model).toEqual({
          ...camelCaseModelResponse,
          $modelType: 'camelCaseTestModel',
        })
        done()
      })
    })

    it('stores error for bad id request', (done) => {
      jasmine.Ajax.stubRequest(`${modelUrl}1/`).andReturn({
        status: 404,
        responseText: 'Not found',
        responseHeaders,
      })
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model.$error).toBe(true)
          done()
        })
    })

    it('can delete a model by id', (done) => {
      jasmine.Ajax.stubRequest(`${modelUrl}1/`).andReturn({
        status: 200,
        responseText: '',
        responseHeaders,
      })
      store.dispatch(api.actions.entityManager.testModel.deleteById(1))
        .then(res => {
          expect(res.status).toBe(200)
          done()
        })
    })

    const specialModelResponse = {
      special_id: 999,
      test: true,
    }

    it('can get a model with special id field and map it to id field', (done) => {
      mockRequest(specialModelResponse, { url: `${modelUrl}${specialModelResponse.special_id}/` })
      let currentModel = {}
      const interval = setInterval(() => {
        const state = store.getState()
        currentModel = api.selectors.entityManager.testModelOtherId2.getEntities(state)
          .getById(specialModelResponse.special_id)
        if (
          currentModel.id === specialModelResponse.special_id &&
          currentModel.test === specialModelResponse.test
        ) {
          clearInterval(interval)
          done()
        }
      }, 0)
    })

    it('can apply server data to a form and use foreign keys as ids', (done) => {
      mockRequest(modelWithForeignKeyResponseWithNull, { url: `${modelUrl}1/` })
      let state = store.getState()
      api.selectors.entityManager.testNestedModelWithForeignKey.getEntities(state).asyncGetById(1)
        .then(model => {
          store.dispatch(forms.actions.foreignKeyTestForm.applyServerData(model))
          state = store.getState()
          const form = forms.selectors.foreignKeyTestForm.getFormWithNulls(state)
          expect(form).toEqual({
            id: 1,
            test: true,
            notInForeignKey: true,
            singleForeignKey: null,
            nestedRestifyField: {
              singleForeignKey: 1,
              moreNested: {
                foreignKeysArray: [1, 2, 3],
              },
            },
            nestedSimpleObject: {
              singleForeignKey: 1,
            },
            notInArray: [1, 2, 3],
          })
          done()
        })
    })

    it('can apply server data to a form with generic key', (done) => {
      mockRequest(modelGenericResponse, { url: `${modelUrl}1/` })
      let state = store.getState()
      api.selectors.entityManager.genericModel.getEntities(state).asyncGetById(1)
        .then(model => {
          store.dispatch(forms.actions.genericTestForm.applyServerData(model))
          state = store.getState()
          const form = forms.selectors.genericTestForm.getForm(state)
          expect(form).toEqual({
            ...modelGenericResponse,
            genericField: {
              // eslint-disable-next-line no-underscore-dangle
              _object: modelGenericResponse.genericField._object,
              id: modelGenericResponse.genericField.id,
            },
          })
          done()
        })
    })

    const formNames = [
      'testRequestFormId',
      'testRequestFormOtherId',
      'requestCustomFormId',
      'requestCustomFormIdConfigured',
    ]
    const modelNames = [
      'testModel',
      'testModelOtherId',
      'customModel',
      'customModelConfigured',
    ]
    const idsObjects = [
      {
        id: 1,
      },
      {
        specialId: 'special',
      },
      {
        id: 1,
      },
      {
        id: 1,
      },
    ]
    const customTestServerArrayResponse = {
      status: 'ok',
      data: [
        {
          id: 1,
          test: '1',
        },
        {
          id: 2,
          test: '2',
        },
        {
          id: 3,
          test: '3',
        },
      ],
    }
    const customTestServerSingleResponse = {
      id: 1,
      test: '1',
    }
    const customEntityResponse = {
      status: 'ok',
      data: customTestServerSingleResponse,
    }
    const customDefaultUrl = `${customModelBulkUrl}`
    const customMockArrayRequest = (response = customTestServerArrayResponse, {
      url = customDefaultUrl,
    } = {}) => {
      jasmine.Ajax.stubRequest(url).andReturn({
        status: 200,
        responseText: JSON.stringify(response),
        responseHeaders,
      })
    }
    const customMockSingleRequest = (response = customTestServerSingleResponse, {
      url = `${customModelSingleUrl}1`,
    } = {}) => {
      jasmine.Ajax.stubRequest(url).andReturn({
        status: 200,
        responseText: JSON.stringify(response),
        responseHeaders,
      })
    }

    const createUrls = [
      modelUrl,
      modelUrl,
      customModelSingleUrl,
      customModelSingleUrl,
    ]
    const updateUrls = [
      `${modelUrl}1/`,
      `${modelUrl}special/`,
      `${customModelSingleUrl}1`,
      `${customModelSingleUrl}1`,
    ]
    const createMethods = [
      'POST',
      'POST',
      'POST',
      'PUT',
    ]
    const updateMethods = [
      'PATCH',
      'PATCH',
      'PATCH',
      'POST',
    ]
    formNames.forEach((formName, index) => {
      it('Can update an entity by id, after form submitting: create and then update. Also for custom urls.', (done) => {
        const idsObj = idsObjects[index]
        const createUrl = createUrls[index]
        const updateUrl = updateUrls[index]
        const createMethod = createMethods[index]
        const updateMethod = updateMethods[index]
        // Test post
        jasmine.Ajax.stubRequest(createUrl).andReturn({
          status: 201,
          responseText: JSON.stringify({
            test: true,
            ...idsObj,
          }),
          responseHeaders,
        })
        const modelName = modelNames[index]
        const idField = modelsDefinitions[modelName].idField || 'id'

        store.dispatch(forms.actions[formName].changeField('test', true))
        store.dispatch(forms.actions[formName].submit()).then(() => {
          // This is just for checking objects equality, cause of id fields are injected in getById result
          store.dispatch(forms.actions[formName].changeField('id', idsObj[idField]))
          let request = jasmine.Ajax.requests.mostRecent()
          let state = store.getState()
          let currentForm = forms.selectors[formName].getForm(state)

          expect(request.data().test).toEqual(currentForm.test)
          expect(request.method).toBe(createMethod)
          let recievedEntity = api.selectors.entityManager[modelName].getEntities(state).getById(idsObj[idField])
          let checkEntity = {
            ...idsObj,
            ...currentForm,
            $modelType: modelName,
          }
          expect(recievedEntity).toEqual(checkEntity)

          // Test patch
          store.dispatch(forms.actions[formName].changeField('test', false))
          jasmine.Ajax.stubRequest(updateUrl).andReturn({
            status: 200,
            responseText: JSON.stringify({
              test: false,
              ...idsObj,
            }),
            responseHeaders,
          })
          store.dispatch(forms.actions[formName].submit()).then(() => {
            request = jasmine.Ajax.requests.mostRecent()
            state = store.getState()
            currentForm = forms.selectors[formName].getForm(state)

            expect(request.data().test).toEqual(currentForm.test)
            expect(request.method).toBe(updateMethod)
            recievedEntity = api.selectors.entityManager[modelName].getEntities(state).getById(idsObj[idField])
            checkEntity = {
              ...currentForm,
              ...idsObj,
              $modelType: modelName,
            }
            expect(recievedEntity).toEqual(checkEntity)
            done()
          })
        })
      })
    })

    const modelsWithTransform = ['customModel', 'customModelConfigured']

    it('can get a model with custom entity response', (done) => {
      customMockSingleRequest(customEntityResponse)
      const state = store.getState()
      api.selectors.entityManager.customModelSingleEntityResponse.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model).toEqual({
            ...customTestServerSingleResponse,
            $modelType: 'customModelSingleEntityResponse',
          })
          done()
        })
    })

    modelsWithTransform.forEach((model) => {
      it('can get a custom model array', (done) => {
        customMockArrayRequest()
        const state = store.getState()
        api.selectors.entityManager[model].getEntities(state).asyncGetArray()
          .then(array => {
            expect(array).toEqual(customTestServerArrayResponse.data.map(item => ({
              ...item,
              $modelType: model,
            })))
            done()
          })
      })

      it('can get a custom model by id', (done) => {
        customMockSingleRequest()
        const state = store.getState()
        api.selectors.entityManager[model].getEntities(state).asyncGetById(1)
          .then(entity => {
            expect(entity).toEqual({
              ...customTestServerSingleResponse,
              $modelType: model,
            })
            done()
          })
      })

      it('can delete custom model by id', (done) => {
        jasmine.Ajax.stubRequest(`${customModelSingleUrl}1`).andReturn({
          status: 200,
          responseText: '',
          responseHeaders,
        })
        store.dispatch(api.actions.entityManager[model].deleteById(1))
          .then(res => {
            expect(res.status).toBe(200)
            done()
          })
      })
    })
  })

  describe('Retries', () => {
    beforeEach(() => {
      beforeEachFunc({
        options: {
          retries: 3,
          retryTimeoutMs: 0,
        },
      })
    })

    it('Can retry a request', (done) => {
      setTimeout(() => {
        // Install jasmine ajax after timeout, so we can simulate network problems
        jasmine.Ajax.install()
        mockRequest(testServerArrayResponse.results[0], { url: `${modelUrl}1/` })
      }, 0)
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetById(1)
        .then(model => {
          expect(model).toEqual(testServerArrayRestifyModels[0])
          jasmine.Ajax.uninstall()
          done()
        })
    })
  })
})
