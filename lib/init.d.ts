export function setRestifyStore(store: any): void;
export function onRegisterApi(func: any): void;
export function registerApi(apiName: any, config: any): void;
export function onRegisterModel(func: any): void;
export function registerModel(modelName: any, config: any): void;
export function onRegisterForm(func: any): void;
export function registerForm(formName: any, config: any): void;
export function onInitRestify(func: any): void;
export function initRestify({ apiDefinitions, modelsDefinitions, formsDefinitions, options, }?: {
    apiDefinitions?: {} | undefined;
    modelsDefinitions?: {} | undefined;
    formsDefinitions?: {} | undefined;
    options?: {} | undefined;
}): void;
