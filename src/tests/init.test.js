import {
  initRestify,
  setRestifyStore,
  registerApi,
  registerModel,
  registerForm,
} from '../init'
import { RESTIFY_CONFIG } from '../config'

import api from '../api'
import EntityList from '../api/models/EntityList'
import forms from '../forms'
import ApiXhrAdapter from '../api/adapters/ApiXhrAdapter'

import createFormConfig from '../forms/formConfig'
import { createModelConfig } from '../api/constants'

import { createRestifyStore } from 'helpers/tests'
import { removePrivateFields } from 'helpers/nestedObjects'

import { ROUTER_LOCATION_CHANGE_ACTION } from '../constants'


const apiDefinitions = {
  testApi: {
    getToken: () => 'test-token',
    apiHost: 'http://test.com/',
    apiPrefix: 'test-api/v1.0/',
    allowedNoTokenEndpoints: [],
    httpCodesCallbacks: () => {},
  },
}

const modelsDefinitions = {
  testModel: {
    endpoint: 'test-model/',
    name: 'Test model',
    defaults: {
      id: undefined,
      test: true,
    },
  },
}

const formsDefinitions = {
  testForm: {
    defaults: {
      test: true,
    },
  },
}

let store

describe('initRestify', () => {
  beforeEach(() => {
    initRestify({
      apiDefinitions,
      modelsDefinitions,
      formsDefinitions,
    })
    const apiReducer = api.getRestifyApiReducer()
    const formsReducer = forms.getRestifyFormReducer()

    store = createRestifyStore(apiReducer, formsReducer)
    setRestifyStore(store)
  })
  it('initializes restify by creating forms, models and apies configurations with default properties', () => {
    expect(RESTIFY_CONFIG.registeredApies).toEqual(Object.keys(apiDefinitions).reduce((memo, key) => {
      return {
        ...memo,
        [key]: new ApiXhrAdapter({
          ...apiDefinitions[key],
          dispatch: store.dispatch,
        }),
      }
    }, {}))
    expect(RESTIFY_CONFIG.registeredModels).toEqual(Object.keys(modelsDefinitions).reduce((memo, key) => {
      return {
        ...memo,
        [key]: createModelConfig(modelsDefinitions[key]),
      }
    }, {}))
    expect(RESTIFY_CONFIG.registeredForms).toEqual(Object.keys(formsDefinitions).reduce((memo, key) => {
      return {
        ...memo,
        [key]: createFormConfig(formsDefinitions[key]),
      }
    }, {}))
  })
  it('throws errors, when registering entities with dublicate names', () => {
    expect(() => registerApi('testApi', apiDefinitions.testApi)).toThrowError(/testApi/)
    expect(() => registerModel('testModel', modelsDefinitions.testModel)).toThrowError(/testModel/)
    expect(() => registerForm('testForm', modelsDefinitions.testForm)).toThrowError(/testForm/)
  })
  it('provides api and forms reducers for each registered entitiy', () => {
    const state = store.getState()
    expect(Object.keys(state.api.entityManager)).toEqual(['testModel'])
    expect(Object.keys(state.forms)).toEqual(['$configs', 'testForm'])
  })

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
})
