import { ACTIONS_TYPES } from '../actionsTypes'
import {
  DOWNLOADING_URL,
  UPLOADING_URL,
} from '../constants'


export const init = {
}

const getDefaultUrlConfig = () => ({
  [DOWNLOADING_URL]: 0,
  [UPLOADING_URL]: 0,
  progress: undefined,
})

const loadsManager = (state = init, action) => {
  switch (action.type) {
    case ACTIONS_TYPES.loadsManager.setUrlStatus:
      return {
        ...state,
        [action.url]: {
          ...(state[action.url] || getDefaultUrlConfig()),
          [action.loadingType]: action.count,
          progress: action.progress || state[action.url] && state[action.url].progress,
        },
      }
    case ACTIONS_TYPES.loadsManager.reset:
      return init
    default:
      return state
  }
}

export default loadsManager
