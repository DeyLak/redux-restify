import { makeActionsBundle } from '~/helpers/actions'

import { MODULE_NAME } from '../constants'
import { onInitRestify } from '../init'


export const NAME = 'api'

const actionsTypesLoadsManager = [
  'SET_URL_STATUS',
  'ERROR',
  'RESET',
]

const actionsTypesEntityManager = [
  'CLEAR_PAGES',
  'CLEAR_DATA',
  'UPDATE_DATA',
  'UPDATE_BY_ID',
  'UPDATE_OPTIMISTIC_BY_ID',
  'SET_LOAD_ERROR_FOR_ID',
  'SET_LOAD_ERROR_FOR_PAGE',
  'SET_LOAD_FINISH',
]

const prefixName = `${MODULE_NAME}/${NAME}`
export const ACTIONS_TYPES = {
  // TODO by @deylak: Add private field here, so it doesn't conflict with models
  loadsManager: makeActionsBundle(prefixName, 'loadsManager', actionsTypesLoadsManager),
  entityManager: makeActionsBundle(prefixName, 'entityManager', actionsTypesEntityManager),
}

onInitRestify(({ modelKeys = {} } = {}) => {
  modelKeys.forEach(modelType => {
    ACTIONS_TYPES[modelType] = makeActionsBundle(prefixName, modelType, actionsTypesEntityManager)
  })
})
