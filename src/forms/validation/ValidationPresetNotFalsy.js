import ValidationPreset from './ValidationPreset'


class ValidationPresetNotFalsy extends ValidationPreset {
  constructor(config = {}) {
    super({
      ...config,
      validate: (currentLevelValues) => !currentLevelValues,
    })
    this.$isValidationPresetNotFalsy = true
  }
}

export default ValidationPresetNotFalsy
