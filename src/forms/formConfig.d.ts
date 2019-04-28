import {
  RestifyId,
  CrudAction,
  HttpMethod,
} from '../api'

import {
  ValidationPreset,
  ValidateFunction,
} from './validation'


export type FormError = string | string[] | object | object[] | boolean;

export type FormTransformationFunction = (key: string, value: any, formValues: any) => any;

export interface RestifyFormConfig<T> {
  baseConfig: string;
  apiName: string;
  endpoint: string;
  model: string;
  updateEntity: boolean;
  id: RestifyId,
  specialAction: string;
  method: HttpMethod;
  onRouteChangeReset: {
    [key in keyof T]: boolean;
  };
  onRefreshReset: {
    [key in keyof T]: boolean;
  };
  defaults: Partial<T>;
  values: Partial<T>;
  submitExclude: {
    [key in keyof T]: boolean;
  } | ((key: string, formValues: any, keyParentPath: string[]) => boolean);
  transformBeforeSubmit: {
    [key in keyof T]: FormTransformationFunction;
  } | FormTransformationFunction;
  resetOnSubmit: boolean;
  deleteOnSubmit: boolean;
  convertToSnakeCaseBeforeSend?: boolean;
  convertResultToCamelCase: boolean;
  resultRemoveNulls: boolean;
  resultOrderArrays: boolean;
  validate: {
    [key in keyof T]: ValidationPreset | ValidateFunction;
  } | ValidateFunction;
  validateOnFieldChange: boolean;
  validateAll: boolean;
  validateOnSubmit: boolean;
  allowSendInvalid: boolean;
  mapServerDataToIds: boolean;
  crudAction: CrudAction,
  query: {
    [key: string]: any;
  },
}
