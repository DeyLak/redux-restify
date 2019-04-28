import { RestifyFormConfig } from './forms'
import { RestifyModelConfig, ApiXhrAdapterConfig } from './api'


export interface RestifyOptions {
  autoPropertiesIdRequests: boolean;
  orderableFormFieldName: string;
}

export interface restifyConfig {
  store: any;
  registeredApies: {
    [apiName: string]: ApiXhrAdapterConfig;
  };
  registeredModels: {
    [modelName: string]: RestifyModelConfig;
  };
  registeredForms: {
    [formName: string]: RestifyFormConfig<any>;
  };
  options: RestifyOptions;
}
