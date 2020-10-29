export default RestifyField;
declare class RestifyField {
    constructor({ verboseName, defaults, transformField, }?: {
        verboseName: any;
        defaults: any;
        transformField: any;
    });
    $isRestifyField: boolean;
    verboseName: any;
    defaults: any;
    transformField: any;
}
