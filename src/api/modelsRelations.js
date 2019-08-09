import set from 'lodash/set'
import unset from 'lodash/unset'

import {
  RestifyArray,
  RestifyLinkedModel,
  RestifyGenericForeignKey,
  RestifyForeignKeysArray,
} from './models'

import { RESTIFY_CONFIG } from '../config'

import { isPureObject } from '~/helpers/def'
import { objectToCamel } from '~/helpers/namingNotation'
import { getNestedObjectField } from '~/helpers/nestedObjects'


// Returns backend entity mapped to restify model
// This includes normalizing entities, converting to camelCase and other restify features
export const mapDataToRestifyModel = (data, modelType) => {
  const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
  if (!currentModel) {
    throw new Error(`
      Attempted to map server data to ${modelType} model type, but no such model registered!
      Check, if you properly defined getGenericModel property for your apies.
    `.trim())
  }
  const currentApi = RESTIFY_CONFIG.registeredApies[currentModel.apiName]

  let resultModel = { ...data }
  if (currentModel.convertToCamelCase) {
    resultModel = objectToCamel(resultModel, {
      removeNulls: false,
      orderArrays: currentModel.orderArrays,
      orderField: RESTIFY_CONFIG.options.orderableFormFieldName,
    })
  }

  const otherModels = {}

  const normalizeKeys = (configPath = [], defaults = currentModel.defaults) => key => {
    const currentConfigPath = configPath.concat(key)
    const currentFieldDefault = defaults[key]
    const currentField = getNestedObjectField(resultModel, currentConfigPath)
    if (currentFieldDefault instanceof RestifyLinkedModel) {
      const modelTypes = (
        Array.isArray(currentFieldDefault.modelType) ? currentFieldDefault.modelType : [currentFieldDefault.modelType]
      )
      modelTypes.forEach(type => {
        if (!otherModels[type]) {
          otherModels[type] = []
        }
      })
      const modelIdField = currentFieldDefault.getIdField(key)
      const modelIdPath = configPath.concat(modelIdField)

      let modelTypeField
      let modelTypeFieldPath
      if (currentFieldDefault instanceof RestifyGenericForeignKey) {
        modelTypeField = currentFieldDefault.getTypeField(key)
        modelTypeFieldPath = configPath.concat(modelTypeField)
      }
      if (currentField !== null && currentField !== undefined) {
        const fieldsToMap = currentFieldDefault instanceof RestifyForeignKeysArray ? currentField : [currentField]
        const mappedIds = []
        const mappedTypes = []

        fieldsToMap.forEach(field => {
          let rawModel = field
          let currentModelType = currentFieldDefault.modelType
          const currentGetGenericModel = currentModel.getGenericModel || currentApi.getGenericModel
          if (currentFieldDefault instanceof RestifyGenericForeignKey) {
            ({ modelType: currentModelType, model: rawModel } = currentGetGenericModel(field, key, data))
          }
          // Reciewed raw id instead of model, just save it, later it will be handled by getById
          if (!isPureObject(rawModel) && rawModel !== null) {
            mappedIds.push(rawModel)
            mappedTypes.push(currentModelType)
          } else {
            // Mapping connected model
            const { model, normalized } = mapDataToRestifyModel(rawModel, currentModelType)
            // Add connected model to normalized models
            otherModels[currentModelType].push(model)
            // If connected model has own normalized models, add them to result
            Object.keys(normalized).forEach(modelName => {
              if (!otherModels[modelName]) {
                otherModels[modelName] = []
              }
              otherModels[modelName] = otherModels[modelName].concat(normalized[modelName])
            })
            mappedIds.push(model.id)
            mappedTypes.push(currentModelType)
          }
        })
        // Setting fields of the restify model
        unset(resultModel, currentConfigPath)
        if (currentFieldDefault instanceof RestifyForeignKeysArray) {
          set(resultModel, modelIdPath, mappedIds)
        } else {
          set(resultModel, modelIdPath, mappedIds[0])
          if (currentFieldDefault instanceof RestifyGenericForeignKey) {
            set(resultModel, modelTypeFieldPath, mappedTypes[0])
          }
        }
      } else {
        unset(resultModel, currentConfigPath)
        if (currentField === null) {
          set(resultModel, modelIdPath, null)
        } else {
          unset(resultModel, modelIdPath)
        }
      }
    } else if (currentFieldDefault instanceof RestifyArray && Array.isArray(currentField)) {
      currentField.forEach((item, index) => {
        Object.keys(currentFieldDefault.defaults).forEach(
          normalizeKeys(currentConfigPath.concat(index), currentFieldDefault.defaults),
        )
      })
    } else if (isPureObject(currentFieldDefault) && !Array.isArray(currentFieldDefault)) {
      Object.keys(currentFieldDefault).forEach(normalizeKeys(currentConfigPath, currentFieldDefault))
    } else if (currentModel.removeNulls && currentField === null) {
      set(resultModel, currentConfigPath, undefined)
      // unset(resultModel, currentConfigPath)
    }
  }
  Object.keys(currentModel.defaults).forEach(normalizeKeys())
  let newId
  if (typeof currentModel.idField === 'string') {
    newId = resultModel[currentModel.idField]
  } else {
    newId = currentModel.idField(resultModel)
  }
  resultModel.id = newId
  return {
    model: resultModel,
    normalized: otherModels,
  }
}
