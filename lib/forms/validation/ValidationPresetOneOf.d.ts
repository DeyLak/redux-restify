export default ValidationPresetOneOf;
declare class ValidationPresetOneOf extends ValidationPreset {
    constructor({ value, ...config }?: {
        value: any;
    });
    $isValidationPresetOneOf: boolean;
}
import ValidationPreset from "./ValidationPreset";
