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
} from './testConfigs'


describe('api', () => {
  beforeEach(() => beforeEachFunc())

  it('provides an EntityList object for each registered model', () => {
    const state = store.getState()
    const testEntities = api.selectors.entityManager.testModel.getEntities(state)
    expect(testEntities).toEqual(jasmine.any(EntityList))
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
        test: false,
      },
      {
        id: 2,
        test: false,
      },
      {
        id: 3,
        test: true,
      },
    ],
  }
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
          expect(currentArray).toEqual(testServerArrayResponse.results)
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
    //       expect(currentArray).toEqual(testServerArrayResponse.results)
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
          expect(array).toEqual(testServerArrayResponse.results)
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
    }

    const configs = [
      {},
      { forceLoad: true },
    ]
    configs.forEach(config => {
      it('can get a model asynchronously', (done) => {
        mockRequest(modelResponse, { url: `${modelUrl}1/` })
        const state = store.getState()
        api.selectors.entityManager.testModel.getEntities(state).asyncGetById(1, config)
          .then(model => {
            expect(model).toEqual(modelResponse)
            done()
          })
      })
    })

    const customUrl = 'custom-url'
    const urls = [
      `${TEST_API_HOST}${TEST_API_PREFIX}${customUrl}/`,
      `${TEST_API_HOST}${OTHER_TEST_API_PREFIX}${customUrl}/`,
    ]
    const apiNames = [
      'testApi',
      'otherTestApi',
    ]
    urls.forEach((url, index) => {
      it('can get a model by special url and custom api name', (done) => {
        mockRequest(modelResponse, { url })
        let state = store.getState()
        api.selectors.entityManager.testModel.getEntities(state)
          .asyncGetByUrl(customUrl, { apiName: apiNames[index] })
          .then((object) => {
            expect(object).toEqual(modelResponse)
            state = store.getState()
            const recievedObject = api.selectors.entityManager.testModel.getEntities(state)
              .getByUrl(customUrl, { apiName: apiNames[index] })
            expect(recievedObject).toEqual(modelResponse)
            done()
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
          expect(currentModel).toEqual(modelResponse)
          clearInterval(interval)
          done()
        }
      }, 0)
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

    const formNames = [
      'testRequestFormId',
      'testRequestFormOtherId',
    ]
    const modelNames = [
      'testModel',
      'testModelOtherId',
    ]
    const idsObjects = [
      {
        id: 1,
      },
      {
        specialId: 'special',
      },
    ]
    formNames.forEach((formName, index) => {
      it('Can update an entity by id, after form submitting: post and then patch', (done) => {
        const idsObj = idsObjects[index]
        // Test post
        jasmine.Ajax.stubRequest(modelUrl).andReturn({
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
          let recievedEntity = api.selectors.entityManager[modelName].getEntities(state).getById(idsObj[idField])
          let checkEntity = {
            ...idsObj,
            ...currentForm,
          }
          expect(recievedEntity).toEqual(checkEntity)

          // Test patch
          store.dispatch(forms.actions[formName].changeField('test', false))
          jasmine.Ajax.stubRequest(`${modelUrl}${idsObj[idField]}/`).andReturn({
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
            recievedEntity = api.selectors.entityManager[modelName].getEntities(state).getById(idsObj[idField])
            checkEntity = {
              ...currentForm,
              ...idsObj,
            }
            expect(recievedEntity).toEqual(checkEntity)
            done()
          })
        })
      })
    })
  })
})
