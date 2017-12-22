import { combineReducers, createStore, applyMiddleware } from 'redux'
import { enableBatching } from 'redux-batched-actions'
import thunk from 'redux-thunk'

const tokenKey = 'redux-restify-storage-key'


export const createStorageTokenSpy = () => {
  return spyOn(window.localStorage, 'getItem').and.callFake((key) => {
    if (key === tokenKey) return 'testToken'
    return undefined
  })
}

export const addDotToStyles = styles => {
  const copy = { ...styles }
  Object.keys(copy).map(key => {
    copy[key] = `.${copy[key]}`
    return key
  })
  return copy
}

const mockGlobalReducer = (moduleName, submoduleName) => reducer => {
  const subReducer = submoduleName ? combineReducers({
    [submoduleName]: reducer,
  }) : reducer
  return combineReducers({
    [moduleName]: subReducer,
  })
}

export const actionsStack = []

const actionsLogger = () => next => action => {
  actionsStack.push(action.type)
  return next(action)
}

const middlewareList = [
  thunk,
  actionsLogger,
]

export const createMockStore = (moduleName, submoduleName) => (reducer, init = {}) => {
  const mockReducer = mockGlobalReducer(moduleName, submoduleName)(reducer)
  return createStore(
    mockReducer,
    {
      [moduleName]: submoduleName ? { [submoduleName]: { ...init } } : { ...init },
    },
    applyMiddleware(...middlewareList),
  )
}

export const createRestifyStore = (apiReducer, formsReducer) => {
  return createStore(
    enableBatching(combineReducers({
      api: apiReducer,
      forms: formsReducer,
    })),
    {},
    applyMiddleware(...middlewareList),
  )
}
