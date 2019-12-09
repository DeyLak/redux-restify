export default ValidationPresetNotOneOf;
declare class ValidationPresetNotOneOf extends ValidationPreset {
    constructor({ value, ...config }?: {
        value: any;
    });
    $isValidationPresetNotOneOf: boolean;
}
import ValidationPreset from "./ValidationPreset";
