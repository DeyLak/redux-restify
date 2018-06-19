import RestifyField from './RestifyField'

class RestifyArray extends RestifyField {
  constructor(config = {}) {
    super(config)
    this.$isRestifyArray = true
  }
}

export default RestifyArray
