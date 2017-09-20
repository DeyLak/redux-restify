import { combineReducers } from 'redux'

import { ACTIONS_TYPES } from '../actionsTypes'
import { getPagesConfigHash, getSpecialIdWithQuery } from '../constants'
import { ROUTER_LOCATION_CHANGE_ACTION } from '../../constants'
import { mergeAndReplaceArrays } from 'helpers/nestedObjects'


const makeEntityObject = obj => ({
  actual: { ...obj },
  optimistic: {},
  // Counter to prevent updateById, if too many forms were sent and entity is in inconsistent state with backend
  // Waits, for all responses and updates, when only one update is pending
  $optimisticCount: 0,
})

const makeIdObj = obj => ({
  [obj.id]: makeEntityObject(obj),
})

const makeIdMap = items => items.reduce((memo, item) => ({
  ...memo,
  ...makeIdObj(item),
}), {})


const init = {
  count: {},
  singleEntities: {},
  loadErrorEntities: {},
  pages: {},
}

const getEntityManagerReducer = (modelTypes) => {
  const result = modelTypes.reduce((memo, modelType) => ({
    ...memo,
    [modelType]: (state = init, action) => {
      switch (action.type) {
        case ACTIONS_TYPES[modelType].clearPages: {
          return {
            ...state,
            pages: {},
          }
        }
        case ACTIONS_TYPES[modelType].updateData: {
          const currentConfigHash = getPagesConfigHash(
            action.filter,
            action.sort,
            action.parentEntities,
            action.specialConfig,
            action.pageSize,
          )
          return {
            ...state,
            count: {
              ...state.count,
              [currentConfigHash]: action.count,
            },
            singleEntities: {
              ...state.singleEntities,
              ...(action.specialConfig ? {} : makeIdMap(action.data)),
            },
            pages: {
              ...state.pages,
              [currentConfigHash]: {
                ...(state.pages[currentConfigHash] || {}),
                [action.page || 1]: (action.specialConfig ? action.data : action.data.map(item => item.id)),
              },
            },
          }
        }
        case ACTIONS_TYPES[modelType].updateById: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          const currentEntity = state.singleEntities[specialId]
          if (currentEntity && currentEntity.$optimisticCount > 1) {
            return {
              ...state,
              singleEntities: {
                ...state.singleEntities,
                [specialId]: {
                  ...currentEntity,
                  $optimisticCount: currentEntity.$optimisticCount - 1,
                },
              },
            }
          }
          return {
            ...state,
            singleEntities: {
              ...state.singleEntities,
              [specialId]: mergeAndReplaceArrays({}, currentEntity, makeEntityObject(action.data)),
            },
            // We are not clearing pages everytime here for smooth lists behavior for user
            pages: action.allowClearPages && state.singleEntities[specialId] === undefined ? {} : state.pages,
          }
        }
        case ACTIONS_TYPES[modelType].updateOptimisticById: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          const currentEntity = state.singleEntities[specialId]
          return {
            ...state,
            singleEntities: {
              ...state.singleEntities,
              [specialId]: {
                actual: (currentEntity && currentEntity.actual) || {},
                optimistic: action.data,
                $optimisticCount: (currentEntity && currentEntity.$optimisticCount + 1) || 1,
              },
            },
          }
        }
        case ACTIONS_TYPES[modelType].setLoadErrorForId: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          return {
            ...state,
            loadErrorEntities: {
              ...state.loadErrorEntities,
              [specialId]: action.error,
            },
          }
        }
        // TODO by @deylak: speak of how we're handling pages and entities updates,
        // For now let's clear pages, so we can update most recent entities while changing route
        // But it's defenetly not a good idea to clear all singleEntities,
        // cause this can lead to very large amount of requests from related entities
        case ROUTER_LOCATION_CHANGE_ACTION:
          if (action.payload.action === 'REPLACE') return state
          return {
            ...state,
            pages: {},
          }
        default:
          return state
      }
    },
  }), {})

  return combineReducers(result)
}

export default getEntityManagerReducer
