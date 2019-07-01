import {
  TransformEntityResponse,
  TransformArrayResponse,
  TransformErrorResponse,
  GetEntityUrl,
} from './adapters'


export type RestifyId = string | number

export interface RestifyModelConfig {
  pageSize: number;
  parent: string;
  endpoint: string;
  allowIdRequests: boolean;
  defaults: {
    id: RestifyId | undefined;
    [key: string]: any;
  };
  pagination: boolean;
  idField: string;
  convertToCamelCase: boolean;
  removeNulls: boolean;
  orderArrays: boolean;
  clearPagesOnRouteChange: boolean;
  clearDataOnRouteChange: boolean;
  apiName: string;
  transformArrayResponse?: TransformArrayResponse;
  transformEntityResponse?: TransformEntityResponse;
  transformErrorResponse?: TransformErrorResponse;
  getEntityUrl?: GetEntityUrl;
  warnAboutUnregisteredFields: boolean;
}
