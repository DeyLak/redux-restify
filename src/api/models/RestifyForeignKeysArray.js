import RestifyLinkedModel from './RestifyLinkedModel'

import { entityLists } from '../constants'


class RestifyForeignKeysArray extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, {
      ...config,
      idField: config.idField || 'Ids',
    })
    const {
      // Also save array as some page config in store
      withPages = false,
      // Optional apiConfig if withPages used
      apiConfig = {},
      // Locks getArray requests for given apiConfig, so we can safely use getArray everywhere without preventLoad
      withRequestsLock,
    } = config
    this.withPages = withPages
    this.apiConfig = apiConfig
    this.$isRestifyForeignKeysArray = true

    if (entityLists && entityLists[modelType] && withRequestsLock !== undefined) {
      entityLists[modelType].setLockForArrayRequests(withRequestsLock, apiConfig)
    }
  }
}

export default RestifyForeignKeysArray
