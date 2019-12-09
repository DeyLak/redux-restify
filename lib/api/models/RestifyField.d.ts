export default RestifyField;
declare class RestifyField {
    constructor({ verboseName, defaults, }?: {
        verboseName: any;
        defaults: any;
    });
    $isRestifyField: boolean;
    verboseName: any;
    defaults: any;
}
