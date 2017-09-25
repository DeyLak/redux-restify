import deepEqual from 'deep-equal'

import ValidationPreset from './ValidationPreset'


class ValidationPresetOneOf extends ValidationPreset {
  constructor({
    value,
    ...config
  } = {}) {
    const arrayValue = Array.isArray(value) ? value : [value]
    super({
      ...config,
      validate: (currentLevelValues) => {
        return !arrayValue.some(value => deepEqual(currentLevelValues, value))
      },
    })
    this.$isValidationPresetOneOf = true
  }
}

export default ValidationPresetOneOf
