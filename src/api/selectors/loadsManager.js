import { createSelector } from 'reselect'

import {
  getQueryHash,
  DOWNLOADING_URL,
  UPLOADING_URL,
} from '../constants'
import GroupedValue, { groupObjects, flushGroupedValues } from 'helpers/GroupedValue'


export const getLoadsManager = state => state.api.loadsManager

export const getUrls = (url, query) => createSelector(
  getLoadsManager,
  (loadsManager) => {
    if (query !== undefined) {
      const currentUrl = loadsManager[url + getQueryHash(query)] || {}
      return [currentUrl]
    }
    const baseUrl = (url || '').split('?')[0]
    return Object.keys(loadsManager).filter(key => key.includes(baseUrl))
                                                    .map(key => ({
                                                      ...loadsManager[key],
                                                      key,
                                                    }))
  },
)

export const getUrl = (url, query) => state => {
  const urls = getUrls(url, query)(state)

  return flushGroupedValues(groupObjects(urls, currentUrl => ({
    [DOWNLOADING_URL]: new GroupedValue(currentUrl[DOWNLOADING_URL], -1),
    [UPLOADING_URL]: new GroupedValue(currentUrl[UPLOADING_URL], -1),
    progress: new GroupedValue(currentUrl.progress, 1),
  })))
}

const isLoading = (type) => (url, query) => state => {
  const foundUrl = getUrl(url, query)(state)
  return !!foundUrl[type]
}

export const getIsUploadingUrl = isLoading(UPLOADING_URL)

export const getIsDownloadingUrl = isLoading(DOWNLOADING_URL)

export const urlLoadsCount = (type) => (url, query) => state => {
  const foundUrl = getUrl(url, query)(state)
  return foundUrl[type] || 0
}

export const getUploadingUrlCount = urlLoadsCount(UPLOADING_URL)

export const getDownloadingUrlCount = urlLoadsCount(DOWNLOADING_URL)

export const getUrlLoadsCount = (url, query) => state => {
  return getUploadingUrlCount(url, query)(state) + getDownloadingUrlCount(url, query)(state)
}

export const getLoadingProgress = (url, query) => state => {
  return getUrl(url, query)(state).progress || 0
}

export const getIsLoadingUrl = (url, query) => state => {
  return getIsUploadingUrl(url, query)(state) || getIsDownloadingUrl(url, query)(state)
}

const loadsCount = (type) => createSelector(
  [getLoadsManager],
  manager => {
    return Object.keys(manager).reduce((memo, key) => {
      return memo + manager[key][type]
    }, 0)
  },
)

export const getUploadsCount = loadsCount(UPLOADING_URL)

export const getDownloadsCount = loadsCount(DOWNLOADING_URL)

export const getIsUploading = createSelector(
  [getUploadsCount],
  uploads => uploads > 0,
)

export const getIsDownloading = createSelector(
  [getDownloadsCount],
  downloads => downloads > 0,
)

export const getIsLoading = createSelector(
  [getIsUploading, getIsDownloading],
  (isUploading, isDownloading) => isUploading || isDownloading,
)
