export default ValidationPresetCombine;
declare class ValidationPresetCombine extends ValidationPreset {
    constructor({ presets, ...config }?: {
        presets: any;
    });
    $isValidationPresetCombine: boolean;
}
import ValidationPreset from "./ValidationPreset";
