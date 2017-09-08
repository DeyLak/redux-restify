import RestifyLinkedModel from './RestifyLinkedModel'


class RestifyForeignKeysArray extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, {
      ...config,
      idField: config.idField || 'Ids',
    })
    this.$isRestifyForeignKeysArray = true
  }
}

export default RestifyForeignKeysArray
