import { combineReducers } from 'redux'

import loadsManager from './loadsManager'
import getEntityManagerReducer from './entityManager'
import { RESTIFY_CONFIG } from '../../config'


const getRestifyApiReducer = () => {
  return combineReducers({
    loadsManager,
    entityManager: getEntityManagerReducer(RESTIFY_CONFIG.modelsTypes),
  })
}

export default getRestifyApiReducer
