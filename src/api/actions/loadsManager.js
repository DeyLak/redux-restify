import { ACTIONS_TYPES } from '../actionsTypes'
import {
  DOWNLOADING_URL,
  UPLOADING_URL,
  getQueryHash,
} from '../constants'
import * as selectors from '../selectors/loadsManager'


const updateUrl = (shift, type) => (url, query) => (dispatch, getState) => {
  const state = getState()
  const currentCount = selectors.urlLoadsCount(type)(url, query)(state)
  return dispatch({
    type: ACTIONS_TYPES.loadsManager.setUrlStatus,
    url: url + getQueryHash(query),
    loadingType: type,
    count: currentCount + shift < 0 ? 0 : currentCount + shift,
  })
}

export const addUpload = updateUrl(1, UPLOADING_URL)
export const removeUpload = updateUrl(-1, UPLOADING_URL)
export const addDownload = updateUrl(1, DOWNLOADING_URL)
export const removeDownload = updateUrl(-1, DOWNLOADING_URL)

export const setLoadingProgress = (progress, url, query) => ({
  type: ACTIONS_TYPES.loadsManager.setUrlStatus,
  progress,
  url: url + getQueryHash(query),
})

// TODO: We should handle errors somehow
export const setLoadingError = (error) => ({
  type: ACTIONS_TYPES.loadsManager.error,
  error,
})
