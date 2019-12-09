export default RestifyLinkedModel;
declare class RestifyLinkedModel extends RestifyField {
    constructor(modelType: any, config?: {});
    $isRestifyLinkedModel: boolean;
    modelType: any;
    idField: any;
    allowNested: any;
    fetchConfig: any;
    getIdField(modelField: any): string;
}
import RestifyField from "./RestifyField";
