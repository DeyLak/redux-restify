import { ACTIONS_TYPES } from './actionsTypes'
import * as actions from './actions'
import * as constants from './constants'
import getRestifyApiReducer from './reducers'
import * as selectors from './selectors'


export * from './models'

export {
  CRUD_ACTIONS,
  DEFAULT_API_NAME,
  DEFAULT_USE_SNAKE_CASE,
} from './constants'

export default {
  actions,
  constants: {
    ...constants,
    ACTIONS_TYPES,
  },
  getRestifyApiReducer,
  selectors,
  useRequestsLock: constants.useRequestsLock,
}
