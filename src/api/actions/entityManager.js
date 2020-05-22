import * as selectors from '../selectors'
import { ACTIONS_TYPES } from '../actionsTypes'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_API_NAME,
  getPagesConfigHash,
  CRUD_ACTIONS,
  getUrlWithParents,
} from '../constants'
import { RESTIFY_CONFIG } from '../../config'
import { onInitRestify } from '../../init'
import {
  ACTIONS_ALERTS,
  ACTION_DELETE,
} from '../../constants'
import * as apiGeneralActions from './general'
import RestifyError from '../models/RestifyError'


const defaultTransformArrayResponse = (response, pagination) => {
  let data
  let count
  let page
  if (!pagination) {
    data = response
    count = response.length
  } else {
    data = response.items || response.results
    count = response.count || response.totalItems
    page = response.page
  }
  return {
    data,
    count,
    page,
  }
}

export const defaulTransformEntityResponse = (response) => ({
  data: response,
})

export const defaulTransformErrorResponse = (response) => ({
  errors: response,
})

export const defaultGetPaginationQuery = (initialQuery, page, pageSize) => ({
  page,
  pageSize,
  ...initialQuery,
})

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
    modelConfig,
  ) => (dispatch) => {
    if (!data || typeof data.map !== 'function') {
      throw new RestifyError(`Tried to update data for ${modelType}, but there is no map function on items!
        May be you should set pagination propery, or transformArrayResponse of the model?`)
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
      modelConfig,
    })
  },

  setLoadErrorForPage: (modelType) => (
    error,
    page,
    pageSize,
    filter,
    sort,
    parentEntities,
    specialConfig,
    modelConfig,
  ) => ({
    type: ACTIONS_TYPES[modelType].setLoadErrorForPage,
    error,
    page,
    pageSize,
    filter,
    sort,
    parentEntities,
    specialConfig,
    modelConfig,
  }),

  showEntityAlert: (modelType) => (actionType) => (dispatch) => {
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName || DEFAULT_API_NAME]
    if (currentApi.alertAction) {
      dispatch(currentApi.alertAction(ACTIONS_ALERTS[actionType](currentModel.name)))
    }
  },

  clearPages: (modelType) => (clearOldPages = true) => ({
    type: ACTIONS_TYPES[modelType].clearPages,
    clearOldPages,
  }),

  clearData: (modelType) => (clearOldSingleEntities = true) => ({
    type: ACTIONS_TYPES[modelType].clearData,
    clearOldSingleEntities,
  }),

  /**
   * Updates an object by id from raw data
   * @param {string|number} [id] - id of model to be updated
   * @param {Object} [data] - raw server data
   * @param {Object} [query] - query, used for this id, so we can store it separatlly from normal model
   * @param {Boolean} [allowClearPages] - should we reset pages, after updating entity(usually for some sorting configs)
   * @return {Object} Redux action to dispatch
   */
  updateById: (modelType) => (id, data, query, parentEntities, allowClearPages = true, loadedById = false) => {
    return {
      type: ACTIONS_TYPES[modelType].updateById,
      id,
      data,
      query,
      parentEntities,
      allowClearPages,
      loadedById,
    }
  },

  /**
   * Updates an object from raw server response
   * @param {string|number} [id] - id of model to be updated
   * @param {Object} [data] - raw server response
   * @param {Object} [query] - query, used for this id, so we can store it separatlly from normal model
   * @param {Boolean} [allowClearPages] - should we reset pages, after updating entity(usually for some sorting configs)
   * @return {Object} Redux action to dispatch
   */
  updateFromRawData: (modelType) => (id, data, query, parentEntities, allowClearPages = true, api, loadedById) => {
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]
    const transformEntityResponse = currentModel && currentModel.transformEntityResponse ||
                                    currentApi && currentApi.transformEntityResponse ||
                                    defaulTransformEntityResponse
    const transformedData = transformEntityResponse(data, api, modelType).data
    return globalActions.updateById(modelType)(id, transformedData, query, parentEntities, allowClearPages, loadedById)
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
    addOptimisticCount: -1,
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
      modelConfig = {},
      urlHash,
    } = config
    let state = getState()
    const currentModel = {
      ...RESTIFY_CONFIG.registeredModels[modelType],
      ...modelConfig,
    }
    const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]

    let query = {
      ...filter,
    }
    if (sort) {
      query[currentApi.defaultSortField] = sort
    }

    // TODO remove pageSize prop from top-level config
    const pageSize = modelConfig.pageSize || config.pageSize ||
                       currentModel && currentModel.pageSize ||
                       currentApi && currentApi.defaultPageSize ||
                       DEFAULT_PAGE_SIZE

    const transformArrayResponse = modelConfig.transformArrayResponse ||
                                    currentModel && currentModel.transformArrayResponse ||
                                    currentApi && currentApi.transformArrayResponse ||
                                    defaultTransformArrayResponse

    if (currentModel.pagination) {
      const getPaginationQuery = modelConfig.getPaginationQuery ||
                                  currentModel && currentModel.getPaginationQuery ||
                                  currentApi && currentApi.getPaginationQuery ||
                                  defaultGetPaginationQuery
      query = getPaginationQuery(query, page, pageSize)
    }

    const onSuccess = (data, status, api) => {
      const transformedData = transformArrayResponse(data, currentModel.pagination, api, modelType)
      return globalActions.updateData(modelType)(
        transformedData.data,
        transformedData.page || page,
        pageSize,
        transformedData.count,
        filter,
        sort,
        parentEntities,
        specialConfig,
        modelConfig,
      )
    }

    const onError = () => {
      return globalActions.setLoadErrorForPage(modelType)(
        true,
        page,
        pageSize,
        filter,
        sort,
        parentEntities,
        specialConfig,
        modelConfig,
      )
    }

    let url = currentModel.endpoint
    if (currentModel.parent) {
      url = getUrlWithParents(url, currentModel, parentEntities)
    }
    return dispatch(apiGeneralActions.callGet({
      apiName: currentModel.apiName,
      getEntityUrl: currentModel.getEntityUrl,
      url,
      onSuccess,
      onError,
      query,
      urlHash,
      crudAction: CRUD_ACTIONS.read,
      convertToCamelCase: currentModel.convertToCamelCase,
    }))
    .then(() => {
      state = getState()
      return selectors.entityManager[modelType].getEntities(state).getArray({
        filter,
        sort,
        parentEntities,
        specialConfig,
        pageSize,
        modelConfig,
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
      modelConfig = {},
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
      console.warn(`Tried to load next page for ${modelType}, but there is no next page found!
        May be your didn't padss the api config to the loadNextPage action?`)
      return Promise.resolve()
    }
    return dispatch(globalActions.loadData(modelType)({
      ...config,
      page: nextPage,
      urlHash: getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize, modelConfig),
    }))
  },

  loadById: (modelType) => (id, config = {}) => (dispatch, getState) => {
    const {
      query,
      urlHash,
      parentEntities,
      useModelEndpoint = true,
    } = config
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    let urlToLoad = useModelEndpoint ? currentModel.endpoint : ''
    if (useModelEndpoint && currentModel.parent) {
      urlToLoad = getUrlWithParents(urlToLoad, currentModel, parentEntities)
    }
    return dispatch(apiGeneralActions.callGet({
      apiName: config.apiName || currentModel.apiName,
      url: urlToLoad,
      onSuccess: (data, status, api) => () =>
        dispatch(globalActions.updateFromRawData(modelType)(id, data, query, parentEntities, undefined, api, true)),
      onError: globalActions.setLoadErrorForId(modelType)(id, true, query, parentEntities),
      query,
      urlHash,
      id,
      crudAction: CRUD_ACTIONS.read,
      getEntityUrl: currentModel.getEntityUrl,
      convertToCamelCase: currentModel.convertToCamelCase,
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

  deleteById: (modelType) => (id, {
    useOptimistic = true,
  } = {}) => (dispatch) => {
    const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
    const urlToLoad = currentModel.endpoint
    if (useOptimistic) {
      dispatch(globalActions.updateOptimisticById(modelType)(id, { $deleted: true }))
    }

    return dispatch(apiGeneralActions.callDel({
      apiName: currentModel.apiName,
      url: urlToLoad,
      getEntityUrl: currentModel.getEntityUrl,
      id,
      crudAction: CRUD_ACTIONS.delete,
      convertToCamelCase: currentModel.convertToCamelCase,
      onSuccess: [
        () => globalActions.updateById(modelType)(id, { $deleted: true }),
        () => globalActions.showEntityAlert(modelType)(ACTION_DELETE),
      ],
      onError: () => () => {
        if (useOptimistic) {
          dispatch(globalActions.discardOptimisticUpdateById(modelType)(id))
        }
      },
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
onInitRestify(({ modelKeys = {} } = {}) => {
  modelKeys.forEach(modelType => {
    entityManager[modelType] = getModelsActions(modelType)
  })
})

export default entityManager
