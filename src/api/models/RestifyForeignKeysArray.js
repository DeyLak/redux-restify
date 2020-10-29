import RestifyLinkedModel from './RestifyLinkedModel'


class RestifyForeignKeysArray extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, {
      ...config,
      idField: config.idField || 'Ids',
    })
    const {
      withPages = false, // Also save array as some page config in store
      apiConfig = {}, // Optional apiConfig if withPages used
    } = config
    this.withPages = withPages
    this.apiConfig = apiConfig
    this.$isRestifyForeignKeysArray = true
  }
}

export default RestifyForeignKeysArray
