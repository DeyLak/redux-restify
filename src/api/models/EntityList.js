import entityManager from '../actions/entityManager'
import {
  getPagesConfigHash,
  DEFAULT_PAGE_SIZE,
  getSpecialIdWithQuery,
  getCacheValidationHashForId,
  getUrlWithParents,
} from '../constants'
import { RESTIFY_CONFIG } from '../../config'
import RestifyArray from './RestifyArray'
import RestifyField from './RestifyField'
import RestifyLinkedModel from './RestifyLinkedModel'
import RestifyGenericForeignKey from './RestifyGenericForeignKey'
import RestifyForeignKeysArray from './RestifyForeignKeysArray'
import RestifyError from './RestifyError'

import { isPureObject, isDefAndNotNull } from '~/helpers/def'
import { getNestedObjectField, mergeAndReplaceArrays } from '~/helpers/nestedObjects'


const getOptimisticEntity = (entity) => {
  return mergeAndReplaceArrays({}, entity.actual, entity.optimistic)
}

// TODO by @deylak remove or rework it after backend supports restoring
// bool: $deleted - entity is deleted, but can be repaired
/**
 * Abstraction class for backernd RESTfull entities.
 * It can:
 * 1. Get entity by id synchronously
 * (due to redux updates it will futher replace loading value with recieved from server)
 * 2. Get entities list with any sorting and filtering(if backend can handle it) the same way
 * 3. Handle pagination for entities lists with every filter and sorting config
 * 4. Get all the same entities and lists asynchronously
 * so you don't need to manage some special loading objects in your code, wich can be usefull for components, but
 * absolutelly useless for async actions
 *
 * Important notes on some contracts with backend:
 * 1. Every RESTfull entity has an int id field for tracking
 * 2. Every RESTfull entity has a bolean deleted field for determine deleted entities
 *
 * API-framework related fields, that can be presented in objects:
 * bool: $loading - entity is loading now
 * bool: $error - there is an error, while loading entity. For now, these use cases are not well-documented
 * bool: $old - data is loading at the moment, but model has old data available in it
 * str: $modelType - model name, to determine, wich model object is related to, can be usefull for abstract components
*/
class EntityList {
  /**
   * @param {string|Object} modelType - Restify registered entity name, or other EntityList object to create a copy
   */
  constructor(modelType) {
    if (modelType instanceof EntityList) {
      this.dispatch = modelType.dispatch
      this.asyncDispatch = modelType.asyncDispatch
      this.modelType = modelType.modelType
      this.modelConfig = modelType.modelConfig
      this.apiConfig = modelType.apiConfig
      this.pages = modelType.pages
      this.oldPages = modelType.oldPages
      this.singles = modelType.singles
      this.oldSingles = modelType.oldSingles
      this.errors = modelType.errors
      this.errorsPages = modelType.errorsPages
      this.urls = modelType.urls
      this.count = modelType.count
      this.idMap = modelType.idMap
      this.pageSize = modelType.pageSize
      this.linkedModelsDict = modelType.linkedModelsDict

      this.arraysLoadingMap = modelType.arraysLoadingMap
      this.idLoaded = modelType.idLoaded
      this.errorsLoaded = modelType.errorsLoaded
      this.noPaginationArraysLoadingMap = modelType.noPaginationArraysLoadingMap
      this.lockedArrayConfigs = modelType.lockedArrayConfigs
    } else {
      this.dispatch = () => {}
      this.asyncDispatch = () => {}
      this.modelType = modelType
      this.modelConfig = RESTIFY_CONFIG.registeredModels[modelType]
      this.apiConfig = RESTIFY_CONFIG.registeredApies[this.modelConfig.apiName]
      this.pageSize = this.modelConfig && this.modelConfig.pageSize ||
                       this.apiConfig && this.apiConfig.defaultPageSize ||
                       DEFAULT_PAGE_SIZE
      this.pages = {}
      this.oldPages = {}
      this.singles = {}
      this.oldSingles = {}
      this.errors = {}
      this.errorsPages = {}
      this.urls = {}
      this.count = {}
      this.idMap = {}
      this.linkedModelsDict = {}

      // Prevent many api calls, couldn't make it work properly only with store, due to many async actions
      // TODO by @deylak may be rework this
      this.arraysLoadingMap = {}
      this.idLoaded = {}
      this.errorsLoaded = {}
      // Track all array requests without pagintaion to prevent getById requests
      // No pagination requests are usually used to prefetch some data (or all of it),
      // so there is no need to load iobjects by id
      this.noPaginationArraysLoadingMap = {}
      // Configs used in requests locking
      this.lockedArrayConfigs = {}
    }
    this.$arrays = undefined
    this.$oldArrays = undefined
    this.precalculatedSingles = {}
  }

  // loadsManager sets downloading url synchronously and causes rerender
  // Zero timeout for dispatch helps to avoid react rerendering warnings, due to asynchronous actions calls
  // but is's still a bit of a hack
  // TODO by @deylak think of some middleware for api actions for future
  setDispatch(dispatch) {
    this.dispatch = dispatch
    this.asyncDispatch = (...args) => {
      return new Promise(res => {
        setTimeout(() => {
          const result = dispatch(...args)
          if (result instanceof Promise) {
            result.then((value) => {
              res(value)
            })
          } else {
            res()
          }
        }, 0)
      })
    }
  }

  checkShouldLoadById(preventLoad, specialId) {
    return (
      !RESTIFY_CONFIG.isRequestsLockSet &&
      !preventLoad &&
      !this.idLoaded[specialId] &&
      !this.errorsLoaded[specialId] &&
      this.modelConfig.allowIdRequests &&
      // No no pagination requests in progress
      !Object.values(this.noPaginationArraysLoadingMap).some(val => val)
    )
  }

  checkShouldLoadArray(preventLoad, configHash) {
    return (
      !preventLoad &&
      !this.arraysLoadingMap[configHash] &&
      // No requests lock or config is not used in locking
      (!RESTIFY_CONFIG.isRequestsLockSet || !this.lockedArrayConfigs[configHash])
    )
  }

  getRestifyModel(
    normalized,
    {
      isNestedModel = false,
      asyncGetters,
      parentEntities,
      preventLoad = false,
      preventAutoGetters = false,
    } = {},
    fields = {},
  ) {
    // Connected models keys, wich are not stored in store and can be misrecognized as missing keys
    const modelKeys = {}
    // Id properties for connected models, so we don't assign them lazy getters
    const modelKeysReverse = {}

    const mapDefaultKeysToModel = (configPath = [], defaults = this.modelConfig.defaults) => (memo, key) => {
      const currentConfigPath = configPath.concat(key)
      const currentField = defaults[key]
      const normalizedField = getNestedObjectField(normalized, currentConfigPath)
      // Fields of the mapped model, corresponding to current config field
      let mappedFields
      if (currentField instanceof RestifyLinkedModel) {
        const modelIdField = currentField.getIdField(key)
        let normalizedIdField = getNestedObjectField(normalized, configPath.concat(modelIdField))

        let modelTypeField
        let normalizedTypeField
        if (currentField instanceof RestifyGenericForeignKey) {
          modelTypeField = currentField.getTypeField(key)
          normalizedTypeField = getNestedObjectField(normalized, configPath.concat(modelTypeField))
        }
        // Getting linked model, or using same model for in-model references
        let linkedModel
        if (currentField.modelType === this.modelType) {
          if (!isNestedModel || currentField.allowNested) {
            linkedModel = this
          }
        } else if (currentField instanceof RestifyGenericForeignKey) {
          linkedModel = this.linkedModelsDict[normalizedTypeField]
        } else {
          linkedModel = this.linkedModelsDict[currentField.modelType]
        }

        if (linkedModel) {
          // Creating nested object from normalized data
          if (currentField instanceof RestifyForeignKeysArray) {
            normalizedIdField = normalizedIdField || []
          }

          mappedFields = {
            [modelIdField]: normalizedIdField,
            [key]: () => {
              let denormalized
              if (currentField instanceof RestifyForeignKeysArray) {
                denormalized = normalizedIdField.map(id => {
                  if (id === null) {
                    return null
                  }
                  return linkedModel.getById(id, {
                    isNestedModel: true,
                    ...currentField.fetchConfig,
                    preventLoad,
                    asyncGetters,
                    preventAutoGetters,
                  })
                })
              } else if (normalizedIdField === null) {
                denormalized = null
              } else {
                const getByIdConfig = {
                  isNestedModel: true,
                  ...currentField.fetchConfig,
                  asyncGetters,
                  preventLoad,
                  preventAutoGetters,
                }
                if (asyncGetters && !linkedModel.hasById(normalizedIdField)) {
                  denormalized = linkedModel.asyncGetById(normalizedIdField, getByIdConfig)
                } else {
                  denormalized = linkedModel.getById(normalizedIdField, getByIdConfig)
                }
              }
              return denormalized
            },
          }
          if (normalizedTypeField) {
            mappedFields[modelTypeField] = normalizedTypeField
          }
          modelKeys[key] = modelIdField === null ? undefined : modelIdField
          if (modelKeys[key]) {
            modelKeysReverse[modelIdField] = key
          }
        } else if (currentField instanceof RestifyGenericForeignKey && normalizedIdField === null) {
          // Creating nested object for null generic
          mappedFields = {
            [modelIdField]: normalizedIdField,
            [key]: () => null,
          }
          modelKeys[key] = modelIdField === null ? undefined : modelIdField
        } else {
          // Nested model calculation not allowed, so not include this field
          mappedFields = {
            [modelIdField]: normalizedIdField,
            // TODO by @deylak remove hack, we shouldn't have any value here
            [key]: {},
          }
          if (normalizedTypeField) {
            mappedFields[modelTypeField] = normalizedTypeField
          }
        }
      } else if (currentField instanceof RestifyArray) {
        let currentArray = normalizedField
        if (currentArray instanceof RestifyArray || !currentArray) {
          currentArray = []
        }
        mappedFields = {
          [key]: (currentArray).map((item, index) => {
            return Object.keys(currentField.defaults).reduce(
              mapDefaultKeysToModel(currentConfigPath.concat(index), currentField.defaults),
            {})
          }),
        }
      } else {
        const currentDefaults = currentField instanceof RestifyField ? currentField.defaults : currentField
        mappedFields = {
          [key]: normalizedField === undefined ? currentDefaults : normalizedField,
        }
        if (isPureObject(currentDefaults) && !Array.isArray(currentDefaults)) {
          if (normalizedField === null) {
            mappedFields = {
              [key]: null,
            }
          } else {
            mappedFields = {
              [key]: Object.keys(currentDefaults).reduce(mapDefaultKeysToModel(currentConfigPath, currentDefaults), {}),
            }
          }
        }
      }
      // TODO by @deylak add debug env
      // mappedFields.$$models = Object.keys(this.linkedModelsDict)

      // We should not use Object.assign so we can save our getters
      Object.keys(mappedFields).forEach(fieldKey => {
        if (typeof mappedFields[fieldKey] === 'function') {
          Object.defineProperty(memo, fieldKey, {
            configurable: true,
            enumerable: true,
            get: mappedFields[fieldKey],
          })
        } else {
          // eslint-disable-next-line no-param-reassign
          memo[fieldKey] = mappedFields[fieldKey]
        }
      })
      return memo
    }
    const result = Object.keys(this.modelConfig.defaults).reduce(mapDefaultKeysToModel(), {
      $modelType: this.modelType,
      ...fields,
    })
    Object.keys(normalized).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        Object.defineProperty(result, key, {
          get: () => {
            if (this.modelConfig.warnAboutUnregisteredFields && key !== 'id' && !key.startsWith('$')) {
              console.warn(`
                Call to ${key} property of ${this.modelType},
                which is presented at back-end, but unregistered in model config!
              `.trim())
            }
            return normalized[key]
          },
        })
      }
    })
    Object.keys(this.modelConfig.defaults).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(normalized, modelKeys[key]) &&
        !Object.prototype.hasOwnProperty.call(normalized, key)) {
        const defaultValue = result[key]
        const autoGetter = () => {
          let returnValue = defaultValue
          if (
            isDefAndNotNull(result.id) &&
            RESTIFY_CONFIG.options.autoPropertiesIdRequests &&
            this.checkShouldLoadById(preventAutoGetters, result.id)
          ) {
            this.idLoaded[result.id] = this.asyncDispatch((dispatch, getState) => {
              const state = getState()
              const { $loadedById } = state.api.entityManager[this.modelType].singleEntities[result.id] || {}
              if ($loadedById) {
                return Promise.resolve({
                  [key]: undefined,
                })
              }
              return dispatch(entityManager[this.modelType].loadById(result.id, {
                urlHash: getSpecialIdWithQuery(result.id, undefined, parentEntities).toString(),
                asyncGetters: true,
                parentEntities,
              }))
            })
              .then((res) => {
                this.idLoaded[result.id] = false
                if (!Object.keys(res).includes(key)) {
                  console.warn(`
                    Call to ${key} property of ${this.modelType},
                    which is presented at model config, but can not be received via id request!
                  `.trim())
                  return defaultValue
                }
                return res
              })
          }
          if (asyncGetters) {
            returnValue = this.idLoaded[result.id] && this.idLoaded[result.id].then((res) => res[key])
          }
          return returnValue
        }
        Object.defineProperty(result, key, {
          enumerable: false,
          configurable: true,
          get: autoGetter,
        })
        if (modelKeys[key]) {
          Object.defineProperty(result, modelKeys[key], {
            enumerable: false,
            configurable: true,
            get: () => {
              if (this.modelConfig.defaults[key] instanceof RestifyForeignKeysArray) {
                return []
              }
              return autoGetter().id
            },
          })
        }
      }
    })
    return result
  }

  getDefaulObject(id, fields = {}, config = {}) {
    const {
      preventAutoGetters,
    } = config
    const result = this.getRestifyModel(
      { id },
      {
        preventLoad: fields.$error || fields.$loading,
        preventAutoGetters,
      },
    )
    result.id = id
    result.$modelType = this.modelType
    Object.keys(fields).forEach(key => {
      result[key] = fields[key]
    })
    return result
  }

  hasById(id, config = {}) {
    const {
      query,
      parentEntities,
    } = config
    const specialId = getSpecialIdWithQuery(id, query, parentEntities)
    return !!this.singles[specialId]
  }

  // TODO by @deylak preventLoad may be can be removed, due to denormalization fields changed to getters
  // Should be tested
  getById(id, config = {}) {
    const {
      query,
      isNestedModel,
      preventLoad = false,
      preventAutoGetters = false,
      forceLoad = false,
      asyncGetters = false,
      parentEntities,
    } = config
    const specialId = getSpecialIdWithQuery(id, query, parentEntities)
    const cacheId = getCacheValidationHashForId(specialId, asyncGetters)
    if (!isDefAndNotNull(specialId)) {
      return this.getDefaulObject(id, {
        $error: false,
        $loading: false,
      })
    }
    if (!forceLoad && (this.errors[specialId] || this.errorsLoaded[specialId])) {
      this.errorsLoaded[specialId] = this.errors[specialId]
      return this.getDefaulObject(id, {
        $error: true,
        $loading: false,
      })
    }
    if (!forceLoad && this.precalculatedSingles[cacheId]) return this.precalculatedSingles[cacheId]
    const currentEntity = this.singles[specialId]
    if (!forceLoad && currentEntity) {
      const result = this.getRestifyModel(getOptimisticEntity(currentEntity), {
        isNestedModel,
        asyncGetters,
        parentEntities,
        preventLoad,
        preventAutoGetters,
      })
      this.precalculatedSingles[cacheId] = result
      return result
    }

    const shouldLoad = this.checkShouldLoadById(preventLoad, specialId)
    if (shouldLoad) {
      this.idLoaded[specialId] = this
        .asyncDispatch(entityManager[this.modelType]
          .loadById(id, {
            ...config,
            parentEntities,
            asyncGetters: true,
            query,
            urlHash: specialId && specialId.toString(),
          }),
        )
        .then((result) => {
          this.idLoaded[specialId] = false
          this.precalculatedSingles[cacheId] = result
          return result
        })
    }

    const oldEntity = this.oldSingles[specialId]

    // This is previous entity state, shown while loading new entities into store,
    if (oldEntity) {
      return this.getRestifyModel(
        getOptimisticEntity(oldEntity),
        {
          isNestedModel,
          asyncGetters,
          parentEntities,
          preventLoad,
        },
        {
          $old: true,
        },
      )
    }
    return this.getDefaulObject(
      id,
      {
        $loading: true,
      },
      {
        preventAutoGetters,
      },
    )
  }

  /**
   * Check, if the given entity is loading from server.
   * @param  {number|string} id - entity id
   * @param  {Object} [config={}] - config
   * @param  {Object} [config.query] - entity specific query, like grouping or filtering
   * @return {Boolean} Is the entity loading.
   */
  getIsLoadingById(id, config = {}) {
    const {
      query,
      parentEntities,
    } = config

    const specialId = getSpecialIdWithQuery(id, query, parentEntities)
    const urlToFind = getUrlWithParents(
      `${this.modelConfig.endpoint}${specialId}`,
      this.modelConfig,
      parentEntities,
    )
    const url = this.urls.find(u => u.key === urlToFind)
    return !url || url.downloading !== 0
  }

  async asyncGetById(id, config = {}) {
    let {
      query,
    } = config
    const {
      forceLoad = false,
      asyncGetters = true,
      parentEntities = undefined,
    } = config
    if (typeof config !== 'object') {
      query = config
    }
    const specialId = getSpecialIdWithQuery(id, query, parentEntities)
    const cacheId = getCacheValidationHashForId(specialId, asyncGetters)
    if (!isDefAndNotNull(specialId) || this.errors[specialId]) return Promise.resolve()
    if (!forceLoad && this.precalculatedSingles[cacheId]) {
      return this.precalculatedSingles[cacheId]
    }
    if (!forceLoad && this.singles[specialId]) {
      const result = this.getRestifyModel(getOptimisticEntity(this.singles[specialId]), {
        asyncGetters,
        parentEntities,
      })
      this.precalculatedSingles[cacheId] = result
      return Promise.resolve(result)
    }
    if (!this.modelConfig.allowIdRequests) {
      console.warn(`
        Tried to async load missing model ${this.modelName} by id: ${id}, but requests for this entity are disabled!
        Returning default model.
      `)
      return Promise.resolve(this.getDefaulObject(id, {
        $loading: true,
      }))
    }
    if (this.idLoaded[specialId]) return this.idLoaded[specialId]
    this.idLoaded[specialId] = this.dispatch(entityManager[this.modelType].loadById(id, {
      ...config,
      parentEntities,
      asyncGetters,
      query,
      urlHash: specialId && specialId.toString(),
    })).then(result => {
      this.idLoaded[specialId] = false
      this.precalculatedSingles[cacheId] = result
      return result
    })
    return this.idLoaded[specialId]
  }

  getByUrl(url, config = {}) {
    return this.getById(url, {
      ...config,
      useModelEndpoint: false,
    })
  }

  async asyncGetByUrl(url, config = {}) {
    return this.asyncGetById(url, {
      ...config,
      useModelEndpoint: false,
    })
  }

  getCalculatedArray(pages) {
    return Object.keys(pages).reduce((memo, pageConfig) => ({
      ...memo,
      [pageConfig]: Object.keys(pages[pageConfig]).reduce((currentArray, page) => {
        return currentArray.concat(
          pages[pageConfig][page]
            .map(item => {
              if (typeof item !== 'object') return this.getById(item)
              return item
            })
            .filter(item => item && !item.$deleted),
        )
      }, []),
    }), {})
  }

  get oldArrays() {
    if (!this.$oldArrays) {
      this.$oldArrays = this.getCalculatedArray(this.oldPages)
    }
    return this.$oldArrays
  }

  get arrays() {
    if (!this.$arrays) {
      this.$arrays = this.getCalculatedArray(this.pages)
    }
    return this.$arrays
  }

  setSource(pages, oldPages, singles, oldSingles, errors, errorsPages, count, urls, linkedModelsDict) {
    this.pages = pages
    this.oldPages = oldPages
    this.singles = singles
    this.oldSingles = oldSingles
    this.errors = errors
    this.errorsPages = errorsPages
    this.count = count
    this.urls = urls
    this.linkedModelsDict = linkedModelsDict
  }

  clearData() {
    this.noPaginationArraysLoadingMap = {}
    this.arraysLoadingMap = {}
    this.idLoaded = {}
    this.errorsLoaded = {}
  }

  getNextPage({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
  } = {}) {
    const pageSizeNew = modelConfig.pageSize || this.pageSize
    if (!this.modelConfig.pagination && !modelConfig.pagination) return undefined
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)
    const currentPages = Object.keys(this.pages[currentConfig] || {})
    const currentCount = this.count[currentConfig] || 0
    const lastPage = currentPages.map(x => +x).sort((a, b) => b - a)[0]

    return (currentPages.length < currentCount / pageSizeNew) && lastPage
      ? lastPage + 1
      : undefined
  }

  getCount({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)
    return this.count[currentConfig] || 0
  }

  // Helper function for saving no paginated requests
  setPaginationArraysLoading(configHash, modelConfig) {
    let currentPagination = modelConfig.pagination
    if (currentPagination === undefined) {
      currentPagination = this.modelConfig.pagination
    }

    this.noPaginationArraysLoadingMap[configHash] = currentPagination
  }

  setLockForArrayRequests(isLocked, {
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
  } = {}) {
    const currentConfigHash = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)

    this.lockedArrayConfigs[currentConfigHash] = isLocked
  }

  getArray({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
    forceLoad = false,
    preventLoad = false,
  } = {}) {
    const currentConfigHash = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)
    if (!forceLoad && this.arrays[currentConfigHash]) {
      return this.arrays[currentConfigHash]
    }
    if (this.errorsPages[currentConfigHash]) {
      return []
    }
    if (this.checkShouldLoadArray(preventLoad, currentConfigHash)) {
      this.setPaginationArraysLoading(currentConfigHash, modelConfig)

      this.arraysLoadingMap[currentConfigHash] = this.asyncDispatch(entityManager[this.modelType]
        .loadData({
          filter,
          sort,
          parentEntities,
          specialConfig,
          modelConfig,
          urlHash: currentConfigHash && currentConfigHash.toString(),
        }))
          .then((result) => {
            this.arraysLoadingMap[currentConfigHash] = false
            this.noPaginationArraysLoadingMap[currentConfigHash] = false

            this.arrays[currentConfigHash] = result
            return result
          })
          .catch((e) => {
            this.arraysLoadingMap[currentConfigHash] = false
            this.noPaginationArraysLoadingMap[currentConfigHash] = false

            if (e instanceof RestifyError) {
              throw e
            } else {
              console.error(e.message)
            }
          })
    }
    return this.oldArrays[currentConfigHash] || []
  }

  /**
   * Check, if the given entity list is being loaded from server
   * @param  {Object} [config] - api config
   * @param  {Object} [config.filter={}] - server filtering options
   * @param  {string} [config.sort] - server sorting option
   * @param  {Object} [config.parentEntities={}] - dict by entity name with parent entities id's
   * @param  {Boolean} [specialConfig=false] - entities from this array should only be available for this config
   * @return {Boolean} Is the array loading.
   */
  getIsLoadingArray({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)
    const urlToFind = getUrlWithParents(
      `${modelConfig.endpoint || this.modelConfig.endpoint}${currentConfig}`,
      this.modelConfig,
      parentEntities,
    )
    const url = this.urls.find(u => u.key === urlToFind)
    return !url || url.downloading !== 0
  }

  async asyncGetArray({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    modelConfig = {},
    forceLoad = false,
  } = {}) {
    const currentConfigHash = getPagesConfigHash(filter, sort, parentEntities, specialConfig, modelConfig)
    if (!forceLoad && this.arrays[currentConfigHash]) {
      return this.arrays[currentConfigHash]
    }
    if (this.arraysLoadingMap[currentConfigHash] instanceof Promise) {
      return this.arraysLoadingMap[currentConfigHash]
    }
    if (this.errorsPages[currentConfigHash]) {
      return []
    }
    this.setPaginationArraysLoading(currentConfigHash, modelConfig)
    this.arraysLoadingMap[currentConfigHash] = this.dispatch(entityManager[this.modelType].loadData({
      filter,
      sort,
      parentEntities,
      specialConfig,
      modelConfig,
      urlHash: currentConfigHash && currentConfigHash.toString(),
    }))
      .then(result => {
        this.arraysLoadingMap[currentConfigHash] = false
        this.noPaginationArraysLoadingMap[currentConfigHash] = false

        this.arrays[currentConfigHash] = result
        return result
      })
      .catch((e) => {
        this.arraysLoadingMap[currentConfigHash] = false
        this.noPaginationArraysLoadingMap[currentConfigHash] = false

        if (e instanceof RestifyError) {
          throw e
        } else {
          console.error(e.message)
        }
      })
    return this.arraysLoadingMap[currentConfigHash]
  }
}

export default EntityList
