/* eslint-disable no-param-reassign */
import { ACTIONS_TYPES } from '../actionsTypes'
import { getPagesConfigHash, getSpecialIdWithQuery, DEFAULT_PAGE_NUMBER } from '../constants'
import { ROUTER_LOCATION_CHANGE_ACTION } from '../../constants'
import { mergeAndReplaceArrays } from '~/helpers/nestedObjects'
import { mapDataToRestifyModel } from '../modelsRelations'
import createModelConfig from '../modelConfig'
import { RESTIFY_CONFIG } from '../../config'


const makeEntityObject = (obj, loadedById = false) => ({
  actual: { ...obj },
  optimistic: {},
  // Counter to prevent updateById, if too many forms were sent and entity is in inconsistent state with backend
  // Waits, for all responses and updates, when only one update is pending
  $optimisticCount: 0,
  $loadedById: loadedById,
})

const makeIdObj = obj => ({
  [obj.id]: makeEntityObject(obj),
})

const makeIdMap = items => items.reduce((memo, item) => ({
  ...memo,
  ...makeIdObj(item),
}), {})

// This function mutates first state parameter, so we can use it for side effects in states of other models
const mutateByIdInState = (state, id, data, allowClearPages = false, loadedById = false) => {
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
          $loadedById: (currentEntity && currentEntity.$loadedById) || false,
        },
        makeEntityObject(data, loadedById),
      ),
    }
  }
  return state
}

// This function mutates first state parameter, so we can use it for side effects in states of other models
const mutatePagesInState = (state, data) => {
  state.count = {
    ...state.count,
    [data.pageHash]: data.count,
  }

  state.pages = {
    ...state.pages,
    [data.pageHash]: {
      ...(state.pages[data.pageHash] || {}),
      [data.page || DEFAULT_PAGE_NUMBER]: data.mappedIds,
    },
  }

  // Clear old page, if any, cause we already have new info for this config
  state.oldPages = {
    ...state.oldPages,
    [data.pageHash]: {
      ...(state.oldPages[data.pageHash] || {}),
      [data.page || DEFAULT_PAGE_NUMBER]: [],
    },
  }
  return state
}

const modelInitState = {
  count: {},
  singleEntities: {},
  oldSingleEntities: {},
  loadErrorEntities: {},
  loadErrorPages: {},
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

  return (state, action) => {
    const newState = { ...initState, ...state }
    const newModelStates = modelTypes.reduce((memo, type) => {
      memo[type] = { ...newState[type] }
      return memo
    }, {})
    if (action.type === ACTIONS_TYPES.entityManager.clearData) {
      return initState
    }

    // Used as side effect for updating linked models in other model states
    const mutateModelsInState = (normalized, pages) => {
      Object.keys(normalized).forEach(modelName => {
        normalized[modelName].forEach(normalizedModel => {
          mutateByIdInState(newModelStates[modelName], normalizedModel.id, normalizedModel)
        })
      })
      Object.keys(pages).forEach(modelName => {
        pages[modelName].forEach(pageModel => {
          mutatePagesInState(newModelStates[modelName], pageModel)
        })
      })
    }

    if (action.type === ACTIONS_TYPES.entityManager.updateData) {
      const { normalized, pages } = mapDataToRestifyModel(action.data, createModelConfig(action.modelConfig))
      mutateModelsInState(normalized, pages)
    } else {
      for (let i = 0; i < modelTypes.length; i += 1) {
        const modelType = modelTypes[i]
        const currentModelState = newModelStates[modelType]
        let newModelState = currentModelState
        switch (action.type) {
          case ACTIONS_TYPES[modelType].clearData: {
            newModelState = {
              ...modelInitState,
              oldSingleEntities: action.clearOldSingleEntities ? {} : currentModelState.singleEntities,
            }
            break
          }
          case ACTIONS_TYPES[modelType].clearPages: {
            newModelState = {
              ...currentModelState,
              pages: {},
              loadErrorPages: {},
              oldPages: action.clearOldPages ? {} : currentModelState.pages,
            }
            break
          }
          case ACTIONS_TYPES[modelType].updateData: {
            const currentConfigHash = getPagesConfigHash(
              action.filter,
              action.sort,
              action.parentEntities,
              action.specialConfig,
              action.modelConfig,
            )
            const normalizedData = action.data.map(item => {
              const { model, normalized, pages } = mapDataToRestifyModel(item, modelType)
              mutateModelsInState(normalized, pages)
              return model
            })

            newModelState = mutatePagesInState(
              {
                ...currentModelState,
                singleEntities: mergeAndReplaceArrays(
                  {},
                  currentModelState.singleEntities,
                  (action.specialConfig ? {} : makeIdMap(normalizedData)),
                ),
              },
              {
                mappedIds: action.specialConfig ? normalizedData : normalizedData.map(item => item.id),
                count: action.count,
                page: action.page,
                pageHash: currentConfigHash,
              },
            )
            break
          }
          case ACTIONS_TYPES[modelType].updateById: {
            const specialId = getSpecialIdWithQuery(action.id, action.query, action.parentEntities)
            const { model, normalized, pages } = mapDataToRestifyModel(action.data, modelType)
            mutateModelsInState(normalized, pages)

            newModelState = mutateByIdInState(
              { ...currentModelState },
              specialId,
              model,
              action.allowClearPages,
              action.loadedById,
            )
            break
          }
          case ACTIONS_TYPES[modelType].updateOptimisticById: {
            const specialId = getSpecialIdWithQuery(action.id, action.query, action.parentEntities)
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
                  $loadedById: (currentEntity && currentEntity.$loadedById) || false,
                },
              },
            }
            break
          }
          case ACTIONS_TYPES[modelType].setLoadErrorForId: {
            const specialId = getSpecialIdWithQuery(action.id, action.query, action.parentEntities)
            newModelState = {
              ...currentModelState,
              loadErrorEntities: {
                ...currentModelState.loadErrorEntities,
                [specialId]: action.error,
              },
            }
            break
          }
          case ACTIONS_TYPES[modelType].setLoadErrorForPage: {
            const currentConfigHash = getPagesConfigHash(
              action.filter,
              action.sort,
              action.parentEntities,
              action.specialConfig,
              action.modelConfig,
            )
            newModelState = {
              ...currentModelState,
              loadErrorPages: {
                ...currentModelState.loadErrorPages,
                [currentConfigHash]: action.error,
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
    }
    Object.keys(newModelStates).forEach(key => {
      newState[key] = newModelStates[key]
    })
    return newState
  }
}

export default getEntityManagerReducer
