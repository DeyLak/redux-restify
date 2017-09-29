import RestifyLinkedModel from './RestifyLinkedModel'


class RestifyRemoteForeignKey extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, config)
    this.$isRestifyRemoteForeignKey = true
  }
}

export default RestifyRemoteForeignKey
