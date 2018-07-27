import RestifyLinkedModel from './RestifyLinkedModel'


class RestifyGenericForeignKey extends RestifyLinkedModel {
  constructor(modelType, config = {}) {
    super(modelType, {
      ...config,
      idField: config.idField || 'Id',
    })
    this.typeField = config.typeField || 'Type'
    this.$isRestifyGenericForeignKey = true
  }

  getTypeField(modelField) {
    return `${modelField}${this.typeField}`
  }
}

export default RestifyGenericForeignKey
