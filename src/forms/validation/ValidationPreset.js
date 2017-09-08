/** Validation rules function
 * @function ValidationPreset~validate
 * @param {*} currentLevelValues - values, of the form node, to wich preset is assigned
 * @param {Object} formValues - all form values
 * @return {string|string[]|Object|Object[]|Boolean}
 * Error message(s) (Object can be a react element, pure-object dict for form keys with errors, or error existence flag)
 */

/**
 * Base validation preset class. Allows to create any form validation rules
 */
class ValidationPreset {
  /**
   * @param  {Object} [config={}] - class config
   * @param  {ValidationPreset~validate} [validate] - function, that defines validation rules
   */
  constructor({
    validate,
  } = {}) {
    this.validate = validate
    this.$isValidationPreset = true
  }
}

export default ValidationPreset
