import { FormError } from '../formConfig'


export type ValidateFunction = (currentLevelValues: any, formValues: any) => FormError;

export interface ValidationPresetConfig {
  validate: ValidateFunction;
}

export interface ValidationPresetWithValueConfig extends ValidationPresetConfig {
  value: any;
}

export class ValidationPreset {
  constructor(config: ValidationPresetConfig);
  validate: ValidateFunction;
  $isValidationPreset: boolean;
}

export class ValidationPresetOneOf extends ValidationPreset {
  constructor(config:  ValidationPresetWithValueConfig);
  $isValidationPresetOneOf: boolean;
}

export class ValidationPresetNotOneOf extends ValidationPreset {
  constructor(config:  ValidationPresetWithValueConfig);
  $isValidationPresetNotOneOf: boolean;
}

export class ValidationPresetRequired extends ValidationPresetNotOneOf {
  constructor(config?: {});
  $isValidationPresetRequired: boolean;
}

export interface ValidationPresetCombineConfig extends ValidationPresetConfig {
  presets: ValidationPreset[];
}

export class ValidationPresetCombine extends ValidationPreset {
  constructor(config: ValidationPresetCombineConfig);
  $isValidationPresetCombine: boolean;
}

export class ValidationPresetNotFalsy extends ValidationPreset {
  constructor(config?: {});
  $isValidationPresetNotFalsy: boolean;
}
