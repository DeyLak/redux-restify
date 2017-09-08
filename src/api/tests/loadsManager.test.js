import { createMockStore } from 'helpers/tests'

import { NAME } from '../constants'
import * as actions from '../actions/loadsManager'
import reducer, { init } from '../reducers/loadsManager'
import * as selectors from '../selectors/loadsManager'


const mockStore = createMockStore(NAME, 'loadsManager')

describe('loadsManager', () => {
  it('sets not-negative number of uploadings and downloadings', () => {
    const store = mockStore(reducer, init)

    const getUploadsCount = () => selectors.getUploadsCount(store.getState())
    store.dispatch(actions.addUpload())
    expect(getUploadsCount()).toEqual(1)
    store.dispatch(actions.removeUpload())
    expect(getUploadsCount()).toEqual(0)
    store.dispatch(actions.removeUpload())
    expect(getUploadsCount()).toEqual(0)

    const getDownloadsCount = () => selectors.getDownloadsCount(store.getState())
    store.dispatch(actions.addDownload())
    expect(getDownloadsCount()).toEqual(1)
    store.dispatch(actions.removeDownload())
    expect(getDownloadsCount()).toEqual(0)
    store.dispatch(actions.removeDownload())
    expect(getDownloadsCount()).toEqual(0)
  })

  it('correctly shows if a given url with query is loading', () => {
    const store = mockStore(reducer, init)
    const url = 'test-url'
    const query = { test: true }

    const getUrlLoadsCount = () => selectors.getUrlLoadsCount(url, query)(store.getState())
    const getUploadingUrlCount = () => selectors.getUploadingUrlCount(url, query)(store.getState())
    const getDownloadingUrlCount = () => selectors.getDownloadingUrlCount(url, query)(store.getState())
    const getIsLoadingUrl = () => selectors.getIsLoadingUrl(url, query)(store.getState())

    expect(getUrlLoadsCount()).toEqual(0)
    expect(getUploadingUrlCount()).toEqual(0)
    expect(getDownloadingUrlCount()).toEqual(0)
    expect(getIsLoadingUrl()).toBe(false)

    store.dispatch(actions.addUpload(url, query))
    expect(getUrlLoadsCount()).toEqual(1)
    expect(getUploadingUrlCount()).toEqual(1)
    expect(getDownloadingUrlCount()).toEqual(0)
    expect(getIsLoadingUrl()).toBe(true)

    store.dispatch(actions.addDownload(url, query))
    expect(getUrlLoadsCount()).toEqual(2)
    expect(getUploadingUrlCount()).toEqual(1)
    expect(getDownloadingUrlCount()).toEqual(1)
    expect(getIsLoadingUrl()).toBe(true)

    store.dispatch(actions.removeUpload(url, query))
    expect(getUrlLoadsCount()).toEqual(1)
    expect(getUploadingUrlCount()).toEqual(0)
    expect(getDownloadingUrlCount()).toEqual(1)
    expect(getIsLoadingUrl()).toBe(true)

    store.dispatch(actions.removeDownload(url, query))
    expect(getUrlLoadsCount()).toEqual(0)
    expect(getUploadingUrlCount()).toEqual(0)
    expect(getDownloadingUrlCount()).toEqual(0)
    expect(getIsLoadingUrl()).toBe(false)
  })

  it('correctly shows if any uploading or downloading is in progress', () => {
    const store = mockStore(reducer, init)

    const getIsUploading = () => selectors.getIsUploading(store.getState())
    const getIsDownloading = () => selectors.getIsDownloading(store.getState())
    const getIsLoading = () => selectors.getIsLoading(store.getState())

    expect(getIsUploading()).toBe(false)
    expect(getIsDownloading()).toBe(false)
    expect(getIsLoading()).toBe(false)

    store.dispatch(actions.addUpload())
    expect(getIsUploading()).toBe(true)
    expect(getIsDownloading()).toBe(false)
    expect(getIsLoading()).toBe(true)

    store.dispatch(actions.addDownload())
    expect(getIsUploading()).toBe(true)
    expect(getIsDownloading()).toBe(true)
    expect(getIsLoading()).toBe(true)

    store.dispatch(actions.removeUpload())
    expect(getIsUploading()).toBe(false)
    expect(getIsDownloading()).toBe(true)
    expect(getIsLoading()).toBe(true)

    store.dispatch(actions.removeDownload())
    expect(getIsUploading()).toBe(false)
    expect(getIsDownloading()).toBe(false)
    expect(getIsLoading()).toBe(false)
  })

  it('can set loading progress', () => {
    const store = mockStore(reducer, init)
    const getLoadingProgress = () => selectors.getLoadingProgress()(store.getState())
    const progress = 42

    expect(getLoadingProgress()).toEqual(0)
    store.dispatch(actions.setLoadingProgress(progress))
    expect(getLoadingProgress()).toEqual(progress)
  })
})
