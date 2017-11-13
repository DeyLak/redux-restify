import set from 'lodash/set'
import unset from 'lodash/unset'

import {
  RestifyArray,
  RestifyForeignKey,
  RestifyForeignKeysArray,
} from './models'

import { RESTIFY_CONFIG } from '../config'

import { isPureObject } from 'helpers/def'
import { objectToCamel } from 'helpers/namingNotation'
import { getNestedObjectField } from 'helpers/nestedObjects'


// Returns backend entity mapped to restify model
// This includes normalizing entities, converting to camelCase and other restify features
export const mapDataToRestifyModel = (data, modelType) => {
  const currentModel = RESTIFY_CONFIG.registeredModels[modelType]

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
    if (currentFieldDefault instanceof RestifyForeignKey || currentFieldDefault instanceof RestifyForeignKeysArray) {
      if (!otherModels[currentFieldDefault.modelType]) {
        otherModels[currentFieldDefault.modelType] = []
      }
      const modelIdField = currentFieldDefault.getIdField(key)
      const modelIdPath = configPath.concat(modelIdField)
      if (currentField) {
        const fieldsToMap = currentFieldDefault instanceof RestifyForeignKeysArray ? currentField : [currentField]
        const mappedIds = []

        fieldsToMap.forEach(field => {
          // Mapping connected model
          const { model, normalized } = mapDataToRestifyModel(field, currentFieldDefault.modelType)
          // Add connected model to normalized models
          otherModels[currentFieldDefault.modelType].push(model)
          // If connected model has own normalized models, add them to result
          Object.keys(normalized).forEach(modelName => {
            if (!otherModels[modelName]) {
              otherModels[modelName] = []
            }
            otherModels[modelName] = otherModels[modelName].concat(normalized[modelName])
          })
          mappedIds.push(model.id)
        })
        // Setting fields of the restify model
        unset(resultModel, currentConfigPath)
        if (currentFieldDefault instanceof RestifyForeignKeysArray) {
          set(resultModel, modelIdPath, mappedIds)
        } else {
          set(resultModel, modelIdPath, mappedIds[0])
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
