export type CrudAction = 'create' | 'update' | 'delete' | 'read'

export type HttpMethod = 'post' |
'patch' |
'get' |
'delete' |
'options' |
'POST' |
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
