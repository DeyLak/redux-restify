import { createSelector } from 'reselect'

import { EntityList, RestifyLinkedModel, RestifyArray } from '../models'
import { RESTIFY_CONFIG } from '../../config'
import { onInitRestify } from '../../init'
import { isPureObject } from 'helpers/def'
import { getNestedObjectField } from 'helpers/nestedObjects'
import RestifyError from '../models/RestifyError'

import { getUrls } from './loadsManager'


const entityManager = {}
const entityLists = {}

const maxRecursion = 10

const getModelSelectorsFromDict = (selectorsDict) => (modelType, excludeModels = {}) => {
  const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
  if (!currentModel) {
    throw new RestifyError(`Tried to get ${modelType} model config, but got undefined.
      May be you used wrong foreign key?`)
  }
  const modelConfig = currentModel.defaults
  const newExcludeModels = { ...excludeModels }

  const getLinkedModels = (configPath = []) => (memo, key) => {
    let currentConfigPath = configPath.concat(key)
    const currentField = getNestedObjectField(modelConfig, currentConfigPath)
    if (newExcludeModels[modelType] >= maxRecursion) return memo
    if (currentField instanceof RestifyLinkedModel) {
      const arrayModelType = Array.isArray(currentField.modelType) ? currentField.modelType : [currentField.modelType]
      // Stop recursion for foreign keys to restricted models
      // console.log(modelType, newExcludeModels, arrayModelType)
      if (currentField.modelType === modelType) return memo

      arrayModelType.forEach(model => {
        newExcludeModels[model] = newExcludeModels[model] || 0
        if (!currentField.allowNested) {
          newExcludeModels[model] = maxRecursion
        } else {
          newExcludeModels[model] += 1
        }
      })
      // Stop getting nested selectors for current model type
      // console.log(modelType, newExcludeModels)
      // if (nestLevel > maxNestLevel && !currentField.allowNested || currentField.modelType === modelType) return memo
      return memo.concat(currentField.modelType)
    } else if (isPureObject(currentField) && !Array.isArray(currentField)) {
      return memo.concat(Object.keys(currentField).reduce(getLinkedModels(currentConfigPath), []))
    } else if (currentField instanceof RestifyArray) {
      currentConfigPath = currentConfigPath.concat('defaults')
      return memo.concat(Object.keys(currentField.defaults).reduce(getLinkedModels(currentConfigPath), []))
    }
    return memo
  }
  const linkedModelsNames = Object.keys(modelConfig).reduce(getLinkedModels(), [])
  return Object.keys(selectorsDict).reduce((memo, key) => ({
    ...memo,
    [key]: selectorsDict[key](modelType, linkedModelsNames, newExcludeModels),
  }), {})
}

const globalSelectors = {
  getPages: (modelType) => (state) => state.api.entityManager[modelType].pages,
  getSingles: (modelType) => (state) => state.api.entityManager[modelType].singleEntities,
  getLoadErrors: (modelType) => (state) => state.api.entityManager[modelType].loadErrorEntities,
  getCount: (modelType) => (state) => state.api.entityManager[modelType].count,
  getEndpoint: (modelType) => () => {
    const modelConfig = RESTIFY_CONFIG.registeredModels[modelType]
    const apiConfig = RESTIFY_CONFIG.registeredApies[modelConfig.apiName]
    return {
      apiHost: apiConfig.apiHost,
      apiPrefix: apiConfig.apiPrefix,
      endpoint: modelConfig.endpoint,
    }
  },

  getEntities: (modelType, linkedModelsNames, excludeModels) => createSelector(
    [
      globalSelectors.getPages(modelType),
      globalSelectors.getSingles(modelType),
      globalSelectors.getLoadErrors(modelType),
      globalSelectors.getCount(modelType),
      getUrls(RESTIFY_CONFIG.registeredModels[modelType].endpoint),
      ...linkedModelsNames.map(modelName => {
        return getModelSelectorsFromDict(globalSelectors)(modelName, excludeModels).getEntities
      }),
    ],
    (pages, singles, errors, count, urls, ...linkedModels) => {
      const source = entityLists[modelType] || modelType
      const newList = new EntityList(source)
      entityLists[modelType] = newList
      newList.setDispatch(RESTIFY_CONFIG.store.dispatch)
      const linkedModelsDict = linkedModels.reduce((memo, item) => ({
        ...memo,
        [item.modelType]: item,
      }), {})
      newList.setSource(pages, singles, errors, count, urls, linkedModelsDict)
      return newList
    },
  ),
}

const getModelSelectors = getModelSelectorsFromDict(globalSelectors)

// This way we avoid recreating selectors(makes them useless),
// opposite to using getModelSelectors function directly every time
onInitRestify(() => {
  RESTIFY_CONFIG.modelsTypes.forEach(modelType => {
    entityManager[modelType] = getModelSelectors(modelType)
  })
})

export default entityManager
