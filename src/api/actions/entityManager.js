import * as selectors from '../selectors'
import { ACTIONS_TYPES } from '../actionsTypes'
import { DEFAULT_PAGE_SIZE, DEFAULT_API_NAME, getPagesConfigHash } from '../constants'
import { RESTIFY_CONFIG } from '../../config'
import { onInitRestify } from '../../init'
import { ACTIONS_ALERTS, ACTION_DELETE } from '../../constants'
import * as apiGeneralActions from './general'


const globalActions = {
  updateData: (modelType) => (
    data,
    page,
    pageSize,
    count,
    filter,
    sort,
    parentEntities,
    specialConfig,
  ) => (dispatch) => {
    if (!data || typeof data.map !== 'function') {
      throw new Error(`Tried to update data for ${modelType}, but there is no map function on items!
        May be you should set pagination propery of the model?`)
    }
    return dispatch({
      type: ACTIONS_TYPES[modelType].updateData,
      data,
      page,
      pageSize,
      count,
      filter,
      sort,
      parentEntities,
      specialConfig,
    })
  },

  updateDataNoPage: (modelType) => (data, pageSize, filter, sort, parentEntities, specialConfig) => {
    return globalActions.updateData(modelType)(
      data,
      undefined,
      pageSize,
      undefined,
      filter,
      sort,
      parentEntities,
      specialConfig,
    )
  },

  showEntityAlert: (modelType) => (actionType) => (dispatch) => {
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName || DEFAULT_API_NAME]
    if (currentApi.alertAction) {
      dispatch(currentApi.alertAction(ACTIONS_ALERTS[actionType](currentModel.name)))
    }
  },

  clearPages: (modelType) => () => ({
    type: ACTIONS_TYPES[modelType].clearPages,
  }),

  /**
   * Updates an object by id from raw server data
   * @param {string|number} [id] - id of model to be updated
   * @param {Object} [data] - raw server data
   * @param {Object} [query] - query, used for this id, so we can store it separatlly from normal model
   * @param {Boolean} [allowClearPages] - should we reset pages, after updating entity(usually for some sorting configs)
   * @return {Object} Redux action to dispatch
   */
  updateById: (modelType) => (id, data, query, allowClearPages = true) => {
    return {
      type: ACTIONS_TYPES[modelType].updateById,
      id,
      data,
      query,
      allowClearPages,
    }
  },

  updateOptimisticById: (modelType) => (id, data, query) => ({
    type: ACTIONS_TYPES[modelType].updateOptimisticById,
    id,
    data,
    query,
  }),

  discardOptimisticUpdateById: (modelType) => (id) => ({
    type: ACTIONS_TYPES[modelType].updateOptimisticById,
    id,
    data: {},
  }),

  setLoadErrorForId: (modelType) => (id, error, query) => ({
    type: ACTIONS_TYPES[modelType].setLoadErrorForId,
    id,
    error,
    query,
  }),

  loadData: (modelType) => (config = {}) => (dispatch, getState) => {
    const {
      page = 1,
      filter = {},
      sort,
      parentEntities = {},
      specialConfig = false,
      urlHash,
    } = config
    let state = getState()
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]

    const query = {
      ...filter,
      [currentApi.defaultSortField]: sort,
    }

    const pageSize = config.pageSize ||
                       currentModel && currentModel.pageSize ||
                       currentApi && currentApi.defaultPageSize ||
                       DEFAULT_PAGE_SIZE
    let onSuccess
    if (currentModel.pagination) {
      query.page = page
      query.pageSize = pageSize
      onSuccess = (data) => globalActions.updateData(modelType)(
        data.items || data.results,
        data.page || page,
        pageSize,
        data.count || data.totalItems,
        filter,
        sort,
        parentEntities,
        specialConfig,
      )
    } else {
      onSuccess = (data) => globalActions.updateDataNoPage(modelType)(
        data,
        pageSize,
        filter,
        sort,
        parentEntities,
        specialConfig,
      )
    }

    let url = currentModel.endpoint
    if (currentModel.parent) {
      const parents = Array.isArray(currentModel.parent) ? currentModel.parent : [currentModel.parent]
      url = parents.reverse().reduce((memo, item) => {
        const currentParent = RESTIFY_CONFIG.registeredModels[item]
        const currentId = parentEntities[item] ? `${parentEntities[item]}/` : ''
        return currentParent.endpoint + currentId + url
      }, url)
    }

    return dispatch(apiGeneralActions.callGet({
      apiName: currentModel.apiName,
      url,
      onSuccess,
      query,
      urlHash,
    }))
    .then(() => {
      state = getState()
      return selectors.entityManager[modelType].getEntities(state).getArray({
        filter,
        sort,
        parentEntities,
        specialConfig,
        pageSize,
      })
    })
    .catch((e) => { throw e })
  },

  loadNextPage: (modelType) => (config = {}) => (dispatch, getState) => {
    const {
      filter = {},
      sort,
      parentEntities = {},
      specialConfig = false,
    } = config
    const state = getState()
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]
    const pageSize = config.pageSize ||
                       currentModel && currentModel.pageSize ||
                       currentApi && currentApi.defaultPageSize ||
                       DEFAULT_PAGE_SIZE
    const nextPage = selectors.entityManager[modelType].getEntities(state).getNextPage(config)
    if (!nextPage) {
      console.warn(`Tried to load next page for ${modelType}, but there is no next page found!`)
      return Promise.resolve()
    }
    return dispatch(globalActions.loadData(modelType)({
      ...config,
      page: nextPage,
      urlHash: getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize),
    }))
  },

  loadById: (modelType) => (id, config = {}) => (dispatch, getState) => {
    const {
      query,
      urlHash,
      useModelEndpoint = true,
    } = config
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    let slash = ''
    if (id && (typeof id !== 'string' || !id.endsWith('/'))) {
      slash = '/'
    }
    const urlToLoad = `${useModelEndpoint ? currentModel.endpoint : ''}${id}${slash}`
    return dispatch(apiGeneralActions.callGet({
      apiName: config.apiName || currentModel.apiName,
      url: urlToLoad,
      onSuccess: (data) => () => dispatch(globalActions.updateById(modelType)(id, data, query)),
      onError: globalActions.setLoadErrorForId(modelType)(id, true, query),
      query,
      urlHash,
    }))
    .then(() => {
      const state = getState()
      return selectors.entityManager[modelType].getEntities(state).getById(id, {
        ...config,
        forceLoad: false,
        preventLoad: true,
      })
    })
  },

  deleteById: (modelType) => (id) => (dispatch) => {
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const urlToLoad = `${currentModel.endpoint}${id}`
    dispatch(globalActions.updateOptimisticById(modelType)(id, { $deleted: true }))

    return dispatch(apiGeneralActions.callDel({
      apiName: currentModel.apiName,
      url: urlToLoad,
      onSuccess: [
        () => globalActions.updateById(modelType)(id, { $deleted: true }),
        () => globalActions.showEntityAlert(modelType)(ACTION_DELETE),
      ],
      onError: globalActions.discardOptimisticUpdateById(modelType)(id),
    }))
  },
}

const getModelsActions = (modelType) => {
  return Object.keys(globalActions).reduce((memo, key) => ({
    ...memo,
    [key]: globalActions[key](modelType),
  }), {})
}

const entityManager = {}

// Here we can use getModelsActions directly, but using events for consistents and backward compatibility
onInitRestify(() => {
  RESTIFY_CONFIG.modelsTypes.forEach(modelType => {
    entityManager[modelType] = getModelsActions(modelType)
  })
})

export default entityManager
