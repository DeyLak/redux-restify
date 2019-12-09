export default RestifyGenericForeignKey;
declare class RestifyGenericForeignKey extends RestifyLinkedModel {
    constructor(modelType: any, config?: {});
    typeField: any;
    $isRestifyGenericForeignKey: boolean;
    getTypeField(modelField: any): string;
}
import RestifyLinkedModel from "./RestifyLinkedModel";
