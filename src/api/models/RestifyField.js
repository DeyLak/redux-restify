class RestifyField {
  constructor({
    verboseName,
    defaults,
    transformField,
  } = {}) {
    this.$isRestifyField = true
    this.verboseName = verboseName
    this.defaults = defaults
    this.transformField = transformField
  }
}

export default RestifyField
