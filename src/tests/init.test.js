import {
  registerApi,
  registerModel,
  registerForm,
} from '../init'
import { RESTIFY_CONFIG } from '../config'

import ApiXhrAdapter from '../api/adapters/ApiXhrAdapter'

import createFormConfig from '../forms/formConfig'
import createModelConfig from '../api/modelConfig'

import {
  apiDefinitions,
  modelsDefinitions,
  formsDefinitions,
  store,
  beforeEachFunc,
} from './testConfigs'


describe('initRestify', () => {
  beforeEach(() => beforeEachFunc())

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

  it('throws error, when registering model with no api name and no default api registered', () => {
    expect(() => registerModel('testModelNoApi', {})).toThrowError(/testModelNoApi/)
  })

  it('provides api and forms reducers for each registered entitiy', () => {
    const state = store.getState()
    expect(Object.keys(state.api.entityManager)).toEqual([
      'testModel',
      'testModelOtherId',
      'testModelWithForeignKey',
      'testModelWithForeignKey2',
    ])
    expect(Object.keys(state.forms)).toEqual([
      '$configs',
      'testForm',
      'testRequestFormId',
      'testRequestFormOtherId',
      'arrayTestForm',
    ])
  })
})
