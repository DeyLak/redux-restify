import entityManager from '../actions/entityManager'
import {
  getPagesConfigHash,
  DEFAULT_PAGE_SIZE,
  getSpecialIdWithQuery,
} from '../constants'
import { RESTIFY_CONFIG } from '../../config'
import RestifyArray from './RestifyArray'
import RestifyForeignKey from './RestifyForeignKey'
import RestifyForeignKeysArray from './RestifyForeignKeysArray'

import { isPureObject, isDefAndNotNull } from 'helpers/def'
import { getNestedObjectField, mergeAndReplaceArrays } from 'helpers/nestedObjects'


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
      this.defaultObject = modelType.defaultObject
      this.modelConfig = modelType.modelConfig
      this.apiConfig = modelType.apiConfig
      this.pages = modelType.pages
      this.singles = modelType.singles
      this.errors = modelType.errors
      this.arrays = modelType.arrays
      this.urls = modelType.urls
      this.count = modelType.count
      this.idMap = modelType.idMap
      this.arrayLoaded = modelType.arrayLoaded
      this.idLoaded = modelType.idLoaded
      this.pageSize = modelType.pageSize
      this.linkedModelsDict = modelType.linkedModelsDict
    } else {
      this.dispatch = () => {}
      this.asyncDispatch = () => {}
      this.modelType = modelType
      this.modelConfig = RESTIFY_CONFIG.registeredModels[modelType]
      this.apiConfig = RESTIFY_CONFIG.registeredApies[this.modelConfig.apiName]
      this.defaultObject = this.modelConfig.defaults
      this.pageSize = this.modelConfig && this.modelConfig.pageSize ||
                       this.apiConfig && this.apiConfig.defaultPageSize ||
                       DEFAULT_PAGE_SIZE
      this.pages = {}
      this.singles = {}
      this.errors = {}
      this.arrays = {}
      this.urls = {}
      this.count = {}
      this.idMap = {}
      this.linkedModelsDict = {}

      // Prevent many api calls, couldn't make it work properly only with store, due to many async actions
      // TODO by @deylak may be rework this
      this.arrayLoaded = {}
      this.idLoaded = {}
    }
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

  getRestifyModel(normalized, {
    isNestedModel = false,
  } = {}) {
    // Connected models keys, wich are not stored in store and can be misrecognized as missing keys
    const modelKeys = {}

    const mapDefaultKeysToModel = (configPath = [], defaults = this.modelConfig.defaults) => (memo, key) => {
      const currentConfigPath = configPath.concat(key)
      const currentField = defaults[key]
      const normalizedField = getNestedObjectField(normalized, currentConfigPath)
      let mappedFields = {
        [key]: normalizedField === undefined ? currentField : normalizedField,
      }
      if (currentField instanceof RestifyForeignKey || currentField instanceof RestifyForeignKeysArray) {
        const modelIdField = currentField.getIdField(key)
        let normalizedIdField = getNestedObjectField(normalized, configPath.concat(modelIdField))
        // Getting linked model, or using same model for in-model references
        let linkedModel
        if (currentField.modelType === this.modelType) {
          if (!isNestedModel || currentField.allowNested) {
            linkedModel = this
          }
        } else {
          linkedModel = this.linkedModelsDict[currentField.modelType]
        }

        if (linkedModel) {
          // Creating nested object from normalized data
          let denormalized
          if (currentField instanceof RestifyForeignKeysArray) {
            normalizedIdField = normalizedIdField || []
            denormalized = normalizedIdField.map(id => {
              return linkedModel.getById(id, {
                isNestedModel: true,
                preventLoad: true,
              })
            })
          } else {
            denormalized = linkedModel.getById(normalizedIdField, {
              isNestedModel: true,
              preventLoad: true,
            })
          }
          mappedFields = {
            [key]: denormalized,
            [modelIdField]: normalizedIdField,
          }
          modelKeys[key] = modelIdField
        } else {
          // Nested model calculation not allowed, so not include this field
          mappedFields = {}
        }
      } else if (isPureObject(currentField) && !Array.isArray(currentField)) {
        mappedFields = {
          [key]: Object.keys(currentField).reduce(mapDefaultKeysToModel(currentConfigPath, currentField), {}),
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
      }
      return {
        ...memo,
        ...mappedFields,
      }
    }
    const result = Object.keys(this.modelConfig.defaults).reduce(mapDefaultKeysToModel(), {})
    Object.keys(normalized).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        Object.defineProperty(result, key, {
          get: () => {
            if (key !== 'id' && !key.startsWith('$')) {
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
      if (!Object.prototype.hasOwnProperty.call(normalized, modelKeys[key] || key)) {
        const defaultValue = result[key]
        Object.defineProperty(result, key, {
          enumerable: !!modelKeys[key],
          get: () => {
            if (isDefAndNotNull(result.id) &&
              RESTIFY_CONFIG.options.autoPropertiesIdRequestd &&
              !this.idLoaded[result.id]
            ) {
              this.idLoaded[result.id] = this.asyncDispatch(entityManager[this.modelType]
                .loadById(result.id)).then((res) => {
                  this.idLoaded[result.id] = false
                  if (!Object.keys(res).includes(key)) {
                    console.warn(`
                      Call to ${key} property of ${this.modelType},
                      which is presented at model config, but can not be recieved via id request!
                    `.trim())
                  }
                })
            }
            return defaultValue
          },
        })
      }
    })
    return result
  }

  getDefaulObject(id) {
    return {
      ...this.getRestifyModel(this.defaultObject),
      id,
      $modelType: this.modelType,
    }
  }

  // TODO by @deylak preventLoad is needed for entity normalization not tried to load entities,
  // while store has not been updated yet. May be making more general actions will solve this
  getById(id, config = {}) {
    const {
      query,
      preventLoad = false,
      forceLoad = false,
    } = config
    const specialId = getSpecialIdWithQuery(id, query)
    if (!isDefAndNotNull(specialId)) {
      return {
        ...this.getDefaulObject(id),
        $error: false,
        $loading: false,
      }
    }
    if (!forceLoad && this.errors[specialId]) {
      return {
        ...this.getDefaulObject(id),
        $error: true,
        $loading: false,
      }
    }

    const currentEntity = this.singles[specialId]
    if (!forceLoad && currentEntity) {
      return this.getRestifyModel(getOptimisticEntity(currentEntity), config)
    }

    let shouldLoad = !preventLoad && !this.idLoaded[specialId]
    if (!this.modelConfig.pagination) {
      shouldLoad = shouldLoad && !Object.keys(this.arrayLoaded).some(key => !!this.arrayLoaded[key])
    }
    if (shouldLoad) {
      this.idLoaded[specialId] = this.asyncDispatch(entityManager[this.modelType]
        .loadById(id, {
          ...config,
          query,
          urlHash: specialId,
        })).then((result) => {
          this.idLoaded[specialId] = false
          return result
        })
    }
    return {
      ...this.getDefaulObject(id),
      $loading: true,
    }
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
    } = config

    const specialId = getSpecialIdWithQuery(id, query)
    const url = this.urls.find(u => u.key === `${this.modelConfig.endpoint}${specialId}`)
    return !!url && url.downloading !== 0
  }

  async asyncGetById(id, config = {}) {
    let {
      query,
    } = config
    const {
      forceLoad = false,
    } = config
    if (typeof config !== 'object') {
      query = config
    }
    const specialId = getSpecialIdWithQuery(id, query)
    if (!isDefAndNotNull(specialId) || this.errors[specialId]) return Promise.resolve()
    if (!forceLoad && this.singles[specialId]) {
      return Promise.resolve(this.getRestifyModel(getOptimisticEntity(this.singles[specialId])))
    }
    if (this.idLoaded[specialId]) return this.idLoaded[specialId]
    this.idLoaded[specialId] = this.dispatch(entityManager[this.modelType].loadById(id, {
      ...config,
      query,
      urlHash: specialId,
    })).then(result => {
      this.idLoaded[specialId] = false
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

  calculateArrays() {
    this.arrays = Object.keys(this.pages).reduce((memo, pageConfig) => ({
      ...memo,
      [pageConfig]: Object.keys(this.pages[pageConfig]).reduce((currentArray, page) => {
        return currentArray.concat(
          this.pages[pageConfig][page]
                .map(item => {
                  if (typeof item !== 'object') return this.getById(item)
                  return item
                })
                .filter(item => item && !item.$deleted),
        )
      }, []),
    }), {})
    return this.arrays
  }

  calculateEntities() {
    this.calculateArrays()
  }

  setSource(pages, singles, errors, count, urls, linkedModelsDict) {
    this.pages = pages
    this.singles = singles
    this.errors = errors
    this.count = count
    this.urls = urls
    this.linkedModelsDict = linkedModelsDict
    this.calculateEntities()
  }

  getNextPage({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    pageSize = this.pageSize,
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize)
    const currentPages = Object.keys(this.pages[currentConfig] || {})
    const currentCount = this.count[currentConfig] || 0
    const lastPage = currentPages.map(x => +x).sort((a, b) => b - a)[0] || 1

    return currentPages.length < currentCount / pageSize ? lastPage + 1 : undefined
  }

  getCount({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    pageSize = this.pageSize,
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize)
    return this.count[currentConfig] || 0
  }

  getArray({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    pageSize = this.pageSize,
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize)
    if (this.arrays[currentConfig]) {
      return this.arrays[currentConfig]
    }
    if (!this.arrayLoaded[currentConfig]) {
      this.arrayLoaded[currentConfig] = this.asyncDispatch(entityManager[this.modelType]
        .loadData({
          pageSize,
          filter,
          sort,
          parentEntities,
          specialConfig,
          urlHash: currentConfig,
        })).then((result) => {
          this.arrayLoaded[currentConfig] = false
          return result
        })
    }
    return []
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
    pageSize = this.pageSize,
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize)
    const url = this.urls.find(u => u.key === `${this.modelConfig.endpoint}${currentConfig}`)
    return !!url && url.downloading !== 0
  }

  async asyncGetArray({
    filter = {},
    sort,
    parentEntities = {},
    specialConfig = false,
    pageSize = this.pageSize,
  } = {}) {
    const currentConfig = getPagesConfigHash(filter, sort, parentEntities, specialConfig, pageSize)
    if (this.arrays[currentConfig]) {
      return this.arrays[currentConfig]
    }
    if (this.arrayLoaded[currentConfig]) return this.arrayLoaded[currentConfig]
    this.arrayLoaded[currentConfig] = this.dispatch(entityManager[this.modelType].loadData({
      pageSize,
      filter,
      sort,
      parentEntities,
      specialConfig,
      urlHash: currentConfig,
    })).then(result => {
      this.arrayLoaded[currentConfig] = false
      return result
    })
    return this.arrayLoaded[currentConfig]
  }
}

export default EntityList
