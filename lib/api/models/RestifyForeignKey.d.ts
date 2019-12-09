export default RestifyForeignKey;
declare class RestifyForeignKey extends RestifyLinkedModel {
    constructor(modelType: any, config?: {});
    $isRestifyForeignKey: boolean;
}
import RestifyLinkedModel from "./RestifyLinkedModel";
