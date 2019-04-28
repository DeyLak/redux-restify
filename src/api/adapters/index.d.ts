import { RestifyId } from '../modelConfig'
import { HttpMethod, CrudAction } from '../constants'


export type GetToken = () => string | null | undefined

export type GetHeaders = () => {
  [key: string]: string | null | undefined;
};

export type AllowedNoTokenEndpoints = Array<string | RegExp>

export type HttpCodesCallbacks = {
  [key: number]: any;
} | ((code: number) => any)

export type TransformArrayResponse = (response: any, pagination: boolean) => {
  data: any[];
  count?: number;
  page?: number;
}

export type TransformEntityResponse = (response: any) => {
  data: any;
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


export type GetPaginationQuery = (userQuery: any, page: number, pageSize: number) => {
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
  getGenericModel?: GetGenericModel;
  getGenericFormField?: GetGenericFormField;
  getPaginationQuery?: GetPaginationQuery;
  authMethod?: string;
  withCredentials?: boolean;
  useSnakeCase?: boolean;
}

export interface ApiCallConfig {
  getEntityUrl?: GetEntityUrl;
  withoutPrefix?: boolean;
  id?: RestifyId;
  crudAction?: CrudAction;
  specialAction?: string;
  query?: {
    [key: string]: any;
  };
  forceMethod?: HttpMethod;
  data?: {
    [key: string]: any;
  };
  urlHash?: string;
  skipLoadsManager?: boolean;
  isBinary?: boolean;
  onXhrReady?: (xhr: XMLHttpRequest) => void;
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
  getPaginationQuery: GetPaginationQuery;
  getEntityUrl: GetEntityUrl;;
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
