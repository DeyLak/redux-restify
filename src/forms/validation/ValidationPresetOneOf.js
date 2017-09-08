import ValidationPreset from './ValidationPreset'


class ValidationPresetOneOf extends ValidationPreset {
  constructor({
    value,
    ...config
  } = {}) {
    const arrayValue = Array.isArray(value) ? value : [value]
    super({
      ...config,
      validate: (currentLevelValues) => !arrayValue.includes(currentLevelValues),
    })
    this.$isValidationPresetOneOf = true
  }
}

export default ValidationPresetOneOf
