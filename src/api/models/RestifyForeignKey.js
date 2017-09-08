import RestifyLinkedModel from './RestifyLinkedModel'


class RestifyForeignKey extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, {
      ...config,
      idField: config.idField || 'Id',
    })
    this.$isRestifyForeignKey = true
  }
}

export default RestifyForeignKey
