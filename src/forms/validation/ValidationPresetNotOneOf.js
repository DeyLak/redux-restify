import ValidationPreset from './ValidationPreset'


class ValidationPresetNotOneOf extends ValidationPreset {
  constructor({
    value,
    ...config
  } = {}) {
    const arrayValue = Array.isArray(value) ? value : [value]
    super({
      ...config,
      validate: (currentLevelValues) => arrayValue.includes(currentLevelValues),
    })
    this.$isValidationPresetNotOneOf = true
  }
}

export default ValidationPresetNotOneOf
