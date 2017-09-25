import ValidationPresetNotOneOf from './ValidationPresetNotOneOf'


class ValidationPresetRequired extends ValidationPresetNotOneOf {
  constructor(config = {}) {
    super({
      ...config,
      value: [undefined, '', []],
    })
    this.$isValidationPresetRequired = true
  }
}

export default ValidationPresetRequired
