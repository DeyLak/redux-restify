/* eslint-disable no-param-reassign */
import { ACTIONS_TYPES } from '../actionsTypes'
import { getPagesConfigHash, getSpecialIdWithQuery, DEFAULT_PAGE_NUMBER } from '../constants'
import { ROUTER_LOCATION_CHANGE_ACTION } from '../../constants'
import { mergeAndReplaceArrays } from '~/helpers/nestedObjects'
import { mapDataToRestifyModel } from '../modelsRelations'
import { RESTIFY_CONFIG } from '../../config'


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

// This function mutates state parameter, so we can use it in other states
const updateByIdInState = (state, id, data, allowClearPages = false) => {
  const currentEntity = state.singleEntities[id]
  if (currentEntity && currentEntity.$optimisticCount > 1) {
    state.singleEntities = {
      ...state.singleEntities,
      [id]: {
        ...currentEntity,
        $optimisticCount: currentEntity.$optimisticCount - 1,
      },
    }
  } else {
    // First clear pages, if we don't have that id, than assign entity by id
    // We are not clearing pages everytime here for smooth lists behavior for user
    if (allowClearPages && state.singleEntities[id] === undefined) {
      state.oldPages = {
        ...state.oldPages,
        ...state.pages,
      }
      state.pages = {}
    }
    state.singleEntities = {
      ...state.singleEntities,
      [id]: mergeAndReplaceArrays(
        {},
        {
          actual: (currentEntity && currentEntity.actual) || {},
          optimistic: {},
          $optimisticCount: (currentEntity && currentEntity.$optimisticCount) || 0,
        },
        makeEntityObject(data),
      ),
    }
  }
  return state
}

const modelInitState = {
  count: {},
  singleEntities: {},
  loadErrorEntities: {},
  pages: {},
  oldPages: {},
}

const getEntityManagerReducer = (modelTypes = []) => {
  const initState = modelTypes.reduce((memo, modelType) => ({
    ...memo,
    [modelType]: { ...modelInitState },
  }), {})
  if (process.env.TEST) {
    // Ensure, that we don't apply any mutations in our updateByIdIsState function
    Object.freeze(initState)
  }

  return (state = initState, action) => {
    const newState = { ...state }
    const newModelStates = modelTypes.reduce((memo, type) => {
      memo[type] = { ...newState[type] }
      return memo
    }, {})
    if (action.type === ACTIONS_TYPES.entityManager.clearData) {
      return initState
    }
    for (let i = 0; i < modelTypes.length; i += 1) {
      const modelType = modelTypes[i]
      const currentModelState = newModelStates[modelType]
      let newModelState = currentModelState
      switch (action.type) {
        case ACTIONS_TYPES[modelType].clearData: {
          newModelState = modelInitState
          break
        }
        case ACTIONS_TYPES[modelType].clearPages: {
          newModelState = {
            ...currentModelState,
            pages: {},
            oldPages: {},
          }
          break
        }
        case ACTIONS_TYPES[modelType].updateData: {
          const currentConfigHash = getPagesConfigHash(
            action.filter,
            action.sort,
            action.parentEntities,
            action.specialConfig,
            action.pageSize,
            action.modelConfig,
          )
          const normalizedData = action.data.map(item => {
            const { model, normalized } = mapDataToRestifyModel(item, modelType)
            // Side effect of updating linked models in other model states
            Object.keys(normalized).forEach(modelName => {
              normalized[modelName].forEach(normalizedModel => {
                updateByIdInState(newModelStates[modelName], normalizedModel.id, normalizedModel)
              })
            })
            return model
          })
          newModelState = {
            ...currentModelState,
            count: {
              ...currentModelState.count,
              [currentConfigHash]: action.count,
            },
            singleEntities: mergeAndReplaceArrays(
              {},
              currentModelState.singleEntities,
              (action.specialConfig ? {} : makeIdMap(normalizedData)),
            ),
            pages: {
              ...currentModelState.pages,
              [currentConfigHash]: {
                ...(currentModelState.pages[currentConfigHash] || {}),
                [action.page || DEFAULT_PAGE_NUMBER]:
                  (action.specialConfig ? normalizedData : normalizedData.map(item => item.id)),
              },
            },
            // Clear old page, if any, cause we already have new info for this config
            oldPages: {
              ...currentModelState.oldPages,
              [currentConfigHash]: {
                ...(currentModelState.oldPages[currentConfigHash] || {}),
                [action.page || DEFAULT_PAGE_NUMBER]: [],
              },
            },
          }
          break
        }
        case ACTIONS_TYPES[modelType].updateById: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          const { model, normalized } = mapDataToRestifyModel(action.data, modelType)
          // Side effect of updating linked models in other model states
          Object.keys(normalized).forEach(modelName => {
            normalized[modelName].forEach(normalizedModel => {
              updateByIdInState(newModelStates[modelName], normalizedModel.id, normalizedModel)
            })
          })
          newModelState = updateByIdInState({ ...currentModelState }, specialId, model, action.allowClearPages)
          break
        }
        case ACTIONS_TYPES[modelType].updateOptimisticById: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          const currentEntity = currentModelState.singleEntities[specialId]
          const addOptimisticCount = action.addOptimisticCount || 1
          newModelState = {
            ...currentModelState,
            singleEntities: {
              ...currentModelState.singleEntities,
              [specialId]: {
                actual: (currentEntity && currentEntity.actual) || {},
                optimistic: action.data,
                $optimisticCount: (currentEntity && currentEntity.$optimisticCount || 0) + addOptimisticCount,
              },
            },
          }
          break
        }
        case ACTIONS_TYPES[modelType].setLoadErrorForId: {
          const specialId = getSpecialIdWithQuery(action.id, action.query)
          newModelState = {
            ...currentModelState,
            loadErrorEntities: {
              ...currentModelState.loadErrorEntities,
              [specialId]: action.error,
            },
          }
          break
        }
        // TODO by @deylak: speak of how we're handling pages and entities updates,
        // For now let's clear pages, so we can update most recent entities while changing route
        // But it's defenetly not a good idea to clear all singleEntities,
        // cause this can lead to very large amount of requests from related entities
        case ROUTER_LOCATION_CHANGE_ACTION:
          if (action.payload.action !== 'REPLACE') {
            const currentModel = RESTIFY_CONFIG.registeredModels[modelType]
            if (currentModel.clearDataOnRouteChange) {
              newModelState = modelInitState
            } else if (currentModel.clearPagesOnRouteChange) {
              newModelState = {
                ...currentModelState,
                pages: {},
                oldPages: {
                  ...currentModelState.oldPages,
                  ...currentModelState.pages,
                },
              }
            }
          }
          break
        default:
          break
      }
      newModelStates[modelType] = newModelState
    }

    Object.keys(newModelStates).forEach(key => {
      newState[key] = newModelStates[key]
    })
    return newState
  }
}

export default getEntityManagerReducer
