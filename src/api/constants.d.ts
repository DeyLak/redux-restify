export type CrudAction = 'create' | 'update' | 'delete' | 'read'

export type HttpMethod = 'post' |
'patch' |
'put' |
'get' |
'delete' |
'options' |
'POST' |
'PUT' |
'PATCH' |
'GET' |
'DELETE' |
'OPTIONS'

export interface RestifyQuery {
  [key: string]: any;
}

export interface RestifyEndpointInfo {
  apiHost: string;
  apiPrefix: string;
  endpoint: string;
}
