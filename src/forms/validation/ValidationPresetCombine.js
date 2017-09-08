import ValidationPreset from './ValidationPreset'


class ValidationPresetCombine extends ValidationPreset {
  constructor({
    presets, // Should be array of other presets
    ...config
  } = {}) {
    super({
      ...config,
      validate: (currentLevelValues, formValues) => {
        return presets.map(preset => preset.validate(currentLevelValues, formValues))
      },
    })
    this.$isValidationPresetCombine = true
  }
}

export default ValidationPresetCombine
