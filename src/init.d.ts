import { RestifyFormConfig } from './forms'
import { RestifyModelConfig, ApiXhrAdapterConfig } from './api'
import { RestifyOptions } from './config'


export function setRestifyStore(store: any): void;
export function registerApi(apiName: string, config: ApiXhrAdapterConfig): void;
export function registerModel(modelName: string, config: RestifyModelConfig): void;
export function registerForm(formName: string, config: RestifyFormConfig<any>): void;
export function initRestify(config?: {
  apiDefinitions?: {
    [apiName: string]: ApiXhrAdapterConfig;
  };
  modelsDefinitions?: {
    [modelName: string]: RestifyModelConfig;
  }
  formsDefinitions?: {
    [formName: string]: RestifyFormConfig<any>;
  }
  options?: Partial<RestifyOptions>,
})
export function updateRestify(config?: {
    apiDefinitions?: {
        [apiName: string]: ApiXhrAdapterConfig;
    };
    modelsDefinitions?: {
        [modelName: string]: RestifyModelConfig;
    }
    formsDefinitions?: {
        [formName: string]: RestifyFormConfig<any>;
    }
    onUpdateRestify?: (() => void) | undefined,
})
