import forms from '../forms'
import api from '../api'

import { removePrivateFields } from 'helpers/nestedObjects'

import EntityList from '../api/models/EntityList'

import { ROUTER_LOCATION_CHANGE_ACTION } from '../constants'

import {
  store,
  beforeEachFunc,
  TEST_API_HOST,
  TEST_API_PREFIX,
  TEST_MODEL_ENDPOINT,
  OTHER_TEST_API_PREFIX,
  modelsDefinitions,
  responseHeaders,

  modelUrl,
  customModelBulkUrl,
  customModelSingleUrl,
} from './testConfigs'


describe('api', () => {
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
      10,
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
      test: {
        nested: undefined,
      },
    })
  })

  it('clears pages after router location changes', () => {
    const testData = [{ id: 1, test: true }, { id: 2, test: false }]
    store.dispatch(api.actions.entityManager.testModel.updateData(
      testData,
      1,
      10,
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

  it('clears all data after router location changes', () => {
    const testData = [{ id: 1, test: true }, { id: 2, test: false }]
    store.dispatch(api.actions.entityManager.testModelOtherId.updateData(
      testData,
      1,
      10,
      2,
      {},
      undefined,
      {},
      false,
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

  it('returns endpoint', () => {
    const endpoint = api.selectors.entityManager.testModel.getEndpoint()
    expect(endpoint).toEqual({
      apiHost: TEST_API_HOST,
      apiPrefix: TEST_API_PREFIX,
      endpoint: TEST_MODEL_ENDPOINT,
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

    // TODO make this work
    // it('Stores an error response for request and doesn\'t make other request' , (done) => {
    //   jasmine.Ajax.stubRequest(defaultUrl).andReturn({
    //     status: 404,
    //     responseText: 'Not found',
    //   })
    //   console.log('erorr test')
    //   let currentArray = []
    //   const interval = setInterval(() => {
    //     const state = store.getState()
    //     currentArray = api.selectors.entityManager.testModel.getEntities(state).getArray()
    //     const request = jasmine.Ajax.requests.mostRecent()
    //     expect(request.status).toEqual(404)
    //     if (currentArray.length > 0) {
    //       clearInterval(interval)
    //       expect(currentArray).toEqual(testServerArrayRestifyModels)
    //       done()
    //     } else {
    //       expect(currentArray).toEqual([])
    //     }
    //   }, 0)
    // })

    it('can get a model array asynchronously', (done) => {
      mockRequest()
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray()
        .then(array => {
          expect(array).toEqual(testServerArrayRestifyModels)
          done()
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

    const modelForeignKeyResponseWithNull = {
      id: 1,
      test: true,
      singleForeignKey: null,
    }

    const modelResponseWithNull = {
      id: 1,
      test: true,
      notInForeignKey: null,
    }

    const modelWithForeignKeyResponse = {
      id: 1,
      test: true,
      notInForeignKey: true,
      notInArray: testServerArrayResponse.results,
    }

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

    // const modelWithForeignKeyResponseId2 = {
    //   ...modelWithForeignKeyResponse,
    //   id: 2,
    // }

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

    // const modelWithForeignKey2PrimitiveKeysResponse = {
    //   id: 2,
    //   foreignKeys: [1, 2],
    // }
    const modelWithForeignKeyRestifyModel = {
      ...modelWithForeignKeyResponse,
      notInArray: modelWithForeignKeyResponse.notInArray.map(item => ({
        ...item,
        $modelType: 'testModel',
      })),
      notInArrayIds: testServerArrayResponse.results.map(item => item.id),
    }
    // const modelWithForeignKeyRestifyModelId2 = {
    //   ...modelWithForeignKeyResponseId2,
    //   notInArrayIds: testServerArrayResponse.results.map(item => item.id),
    // }

    const modelWithForeignKeyResponse2 = {
      ...modelWithForeignKeyRestifyModel,
      test: false,
    }
    const configs = [
      {},
      { forceLoad: true },
      { asyncGetters: false },
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

    it('can get a model asynchronously with null foreign key and don\t make request for it again', (done) => {
      const idUrl = `${modelUrl}1/`
      mockRequest(modelForeignKeyResponseWithNull, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1)
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
      mockRequest(modelResponseWithNull, { url: idUrl })
      let state = store.getState()
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1)
        .then(() => {
          const request = jasmine.Ajax.requests.mostRecent()
          state = store.getState()
          const currentEntity = api.selectors.entityManager.testModelWithForeignKey.getEntities(state).getById(1)
          expect(currentEntity).toEqual({
            ...modelResponseWithNull,
            notInForeignKey: undefined,
            $modelType: 'testModelWithForeignKey',
          })

          mockRequest(modelWithForeignKeyResponse, { url: idUrl })
          const nullFieldValue = currentEntity.notInForeignKey
          expect(nullFieldValue).toBe(undefined)
          setTimeout(() => {
            const newRequest = jasmine.Ajax.requests.mostRecent()
            expect(request).toBe(newRequest)
            done()
          }, 1)
        })
    })

    // TODO by @deylak Fix this test
    // This test somehow by setting interval mess up other tests, but works without them
    // it('can get a model asynchronously with foreign keys as primitive ids and use them for auto-request', (done) => {
    //   const idUrl = `${modelUrl}2/`
    //   mockRequest(modelWithForeignKey2PrimitiveKeysResponse, { url: idUrl })
    //   let state = store.getState()
    //   api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).asyncGetById(2)
    //     .then(() => {
    //       mockRequest(modelWithForeignKeyResponseId2, { url: idUrl })
    //       const interval = setInterval(() => {
    //         state = store.getState()
    //         const currentModel = api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).getById(2)
    //         // expect(currentModel.foreignKeys.length).toBe(2)
    //         const currentLazyEntity = currentModel.foreignKeys[1]
    //         // console.log(currentModel.foreignKeys)

    //         // if (!currentLazyEntity.$loading) {
    //           clearInterval(interval)
    //       //     expect(currentLazyEntity).toEqual(modelWithForeignKeyRestifyModelId2)
    //           done()
    //         // }
    //       }, 0)
    //     })
    // })

    it('can get a default model with default fields for arrays, while loading it', () => {
      const state = store.getState()
      const currentEntity = api.selectors.entityManager.testModelWithForeignKey2.getEntities(state).getById(1)
      expect(currentEntity.foreignKeys).toEqual([])
    })

    it('Prevent id requests for entities with allowIdRequest === true', (done) => {
      spyOn(console, 'warn') // Test will produce warnin, but we don't wont to read it
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

    it('can get a model for camelCase api', (done) => {
      mockRequest(modelResponse, { url: `${modelUrl}1/?camelCaseParam=1` })
      const state = store.getState()
      api.selectors.entityManager.camelCaseTestModel.getEntities(state).asyncGetById(1, { query: {
        camelCaseParam: 1,
      } }).then(() => {
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
        currentModel = api.selectors.entityManager.testModelOtherId.getEntities(state)
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
      api.selectors.entityManager.testModelWithForeignKey.getEntities(state).asyncGetById(1)
        .then(model => {
          store.dispatch(forms.actions.foreignKeyTestForm.applyServerData(model))
          state = store.getState()
          const form = forms.selectors.foreignKeyTestForm.getForm(state)
          expect(form).toEqual({
            ...modelWithForeignKeyResponse,
            // Null is converted to undefined by getForm
            singleForeignKey: undefined,
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
})
