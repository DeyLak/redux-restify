class RestifyArray {
  constructor({
    defaults = {},
  } = {}) {
    this.$isRestifyArray = true
    this.defaults = defaults
  }
}

export default RestifyArray
