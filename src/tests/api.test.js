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
} from './testConfigs'


describe('api', () => {
  beforeEach(beforeEachFunc)

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
  describe('Server interactions', () => {
    beforeEach(() => {
      jasmine.Ajax.install()
      jasmine.Ajax.stubRequest(
        `${TEST_API_HOST}${TEST_API_PREFIX}${TEST_MODEL_ENDPOINT}?page=1&page_size=10`,
      ).andReturn({
        status: 200,
        responseText: JSON.stringify(testServerArrayResponse),
        responseHeaders: [
          {
            name: 'Content-type',
            value: 'application/json',
          },
        ],
      })
    })

    afterEach(() => {
      jasmine.Ajax.uninstall()
    })

    it(`initializes a background server request for array and returns empty array for unloaded one,
      but doesn't make another request for same config`, (done) => {
      const state = store.getState()
      const testArray = api.selectors.entityManager.testModel.getEntities(state).getArray()
      expect(testArray).toEqual([])
      done()
    })

    it('can get a model asynchronously', (done) => {
      const state = store.getState()
      api.selectors.entityManager.testModel.getEntities(state).asyncGetArray()
        .then(array => {
          expect(array).toEqual(testServerArrayResponse.results)
          done()
        })
    })
  })
})
