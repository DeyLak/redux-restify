import { Dispatch } from 'redux'

import { RestifyId } from '../modelConfig'
import { HttpMethod, CrudAction } from '../constants'


type Token = string | null | undefined
export type GetToken = (dispatch: Dispatch<any>) => Token | Promise<Token>

interface Headers {
  [key: string]: string | null | undefined;
}
export type GetHeaders = () => Headers | Promise<Headers>;

export type AllowedNoTokenEndpoints = Array<string | RegExp>

export type HttpCodesCallbacks = {
  [key: number]: any;
} | ((code: number, data: any, invokeBaseCallbacks: () => any) => any)

export type TransformArrayResponse = (response: any, pagination: boolean, api: any, modelName: string) => {
  data: any[];
  count?: number;
  page?: number;
}

export type TransformEntityResponse = (response: any, api: any, modelName: string) => {
  data: any;
}

export type TransformErrorResponse = (response: any, api: any, modelName: string) => {
  errors: any;
}

export type GetGenericModel = (genericFieldRawValue: any) => {
  modelType: string;
  model: any;
}

export type GetGenericFormField = (model: any) => RestifyId

export type GetEntityUrl = (config: {
  apiHost: string;
  apiPrefix: string;
  modelEndpoint: string;
  entityId: RestifyId;
  crudAction: CrudAction;
  specialAction: string;
}) => string;


export type GetPaginationQuery = (userQuery: any, page: number, pageSize: number, pagination: boolean) => {
  [key: string]: any;
}

export interface ApiXhrAdapterConfig {
  getToken?: GetToken;
  getCSRFToken?: GetToken;
  getHeaders?: GetHeaders;
  apiHost: string;
  apiPrefix: string;
  dispatch?: any;
  allowedNoTokenEndpoints?: AllowedNoTokenEndpoints;
  httpCodesCallbacks?: HttpCodesCallbacks;
  defaultPageSize?: number;
  deafultDateFormat?: string;
  defaultSortField?: string;
  transformArrayResponse?: TransformArrayResponse;
  getEntityUrl?: GetEntityUrl;
  transformEntityResponse?: TransformEntityResponse;
  transformErrorResponse?: TransformErrorResponse;
  getGenericModel?: GetGenericModel;
  getGenericFormField?: GetGenericFormField;
  getPaginationQuery?: GetPaginationQuery;
  authMethod?: string;
  withCredentials?: boolean;
  useSnakeCase?: boolean;
}

export interface ApiCallConfig {
  getEntityUrl?: GetEntityUrl;
  apiName?: string;
  withoutPrefix?: boolean;
  id?: RestifyId;
  crudAction?: CrudAction;
  specialAction?: string;
  query?: Record<string, any>;
  forceMethod?: HttpMethod;
  data?: Record<string, any>;
  urlHash?: string;
  skipLoadsManager?: boolean;
  isBinary?: boolean;
  onXhrReady?: (xhr: XMLHttpRequest) => void | Promise<void>;
}

export class ApiXhrAdapter {
  constructor(config: ApiXhrAdapterConfig);
  getToken: GetToken;
  getCSRFToken: GetToken;
  getHeaders: GetHeaders;
  apiHost: string;
  apiPrefix: string;
  dispatch: any;
  allowedNoTokenEndpoints: AllowedNoTokenEndpoints;
  httpCodesCallbacks: HttpCodesCallbacks;
  defaultPageSize: number;
  deafultDateFormat: string;
  defaultSortField: string;
  transformArrayResponse: TransformArrayResponse;
  transformEntityResponse: TransformEntityResponse;
  transformErrorResponse: TransformErrorResponse;
  getPaginationQuery: GetPaginationQuery;
  getEntityUrl: GetEntityUrl;
  getGenericModel: GetGenericModel;
  getGenericFormField: GetGenericFormField;
  authMethod: string;
  withCredentials: boolean;
  useSnakeCase: boolean;

  callGet: (baseUrl: string, config: ApiCallConfig) => Promise<any>;
  callPost: (baseUrl: string, config: ApiCallConfig) => Promise<any>;
  callPut: (baseUrl: string, config: ApiCallConfig) => Promise<any>;
  callPatch: (baseUrl: string, config: ApiCallConfig) => Promise<any>;
  callDel: (baseUrl: string, config: ApiCallConfig) => Promise<any>;
}
