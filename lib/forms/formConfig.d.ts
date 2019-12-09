export namespace DEFAULT_FIELD_FUNCTIONS {
    export { UUID_FUNC as $uuid };
}
export namespace DEFAULT_FIELD_FUNCTIONS_VALUES {
    export { uuidV4 as $uuid };
}
export namespace DEFAULT_FORM_OBJECT {
    export const baseConfig: undefined;
    export const apiName: undefined;
    export const endpoint: string;
    export const model: string;
    export const useOptimisticUpdate: boolean;
    export const updateEntity: boolean;
    export const id: undefined;
    export const specialAction: string;
    export const method: undefined;
    export const onRouteChangeReset: {};
    export const onRefreshReset: {};
    export const defaults: {};
    export const values: {};
    export const submitExclude: {};
    export const transformBeforeSubmit: {};
    export const resetOnSubmit: boolean;
    export const deleteOnSubmit: boolean;
    export const convertToSnakeCaseBeforeSend: undefined;
    export const convertResultToCamelCase: boolean;
    export const resultRemoveNulls: boolean;
    export const resultOrderArrays: boolean;
    export const onSuccess: undefined;
    export const syncWithRouter: {};
    export const validate: undefined;
    export const validateOnFieldChange: boolean;
    export const validateAll: boolean;
    export const validateOnSubmit: boolean;
    export const allowSendInvalid: boolean;
    export const mapServerDataToIds: boolean;
    export const trackDirtyFields: boolean;
    export const submitOnlyDirtyFields: boolean;
    export const crudAction: undefined;
    export const query: undefined;
}
export function getFormObjectConfig(formType: any, name: any, config: any): any;
export const ARRAY_DEFAULTS_INDEX: 0;
export const ARRAY_CONFIG_INDEX: 1;
export function getDefaultObject(obj: any): any;
export function getFormArrayConfig(...args: any[]): any;
export function getFormDefaultValue(...args: any[]): any;
export function updateDefaultValue(defaultValue: any, value: any): any;
export function getComposedConfig(config: any): any;
export function removeArrayDefaults(config: any): {};
export function getDefaultFormObject(config: any): any;
export default createFormConfig;
declare const UUID_FUNC: "$uuid";
declare function createFormConfig(config: any): any;
