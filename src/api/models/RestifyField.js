class RestifyField {
  constructor({
    verboseName,
    defaults,
  } = {}) {
    this.$isRestifyField = true
    this.verboseName = verboseName
    this.defaults = defaults
  }
}

export default RestifyField
