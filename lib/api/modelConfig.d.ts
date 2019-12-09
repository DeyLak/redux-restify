export namespace DEFAULT_MODEL_OBJECT {
    export const pageSize: undefined;
    export const parent: undefined;
    export const endpoint: string;
    export const allowIdRequests: boolean;
    export namespace defaults {
        export const id: undefined;
    }
    export const pagination: boolean;
    export const idField: string;
    export const convertToCamelCase: boolean;
    export const removeNulls: boolean;
    export const orderArrays: boolean;
    export const clearPagesOnRouteChange: boolean;
    export const clearDataOnRouteChange: boolean;
    export { DEFAULT_API_NAME as apiName };
    export const transformArrayResponse: undefined;
    export const transformEntityResponse: undefined;
    export const transformErrorResponse: undefined;
    export const getGenericModel: undefined;
    export const getEntityUrl: undefined;
    export const warnAboutUnregisteredFields: boolean;
}
export default createModelConfig;
declare function createModelConfig(config: any): any;
