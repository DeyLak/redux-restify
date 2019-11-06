import { ActionCreatorsMapObject } from 'redux'

import { ApiCallConfig } from './adapters'
import { RestifyId, RestifyModelConfig } from './modelConfig'
import { CrudAction, RestifyQuery, RestifyEndpointInfo } from './constants'
import { GetByIdConfig, RestifyEntityList } from './models'


export * from './models'
export * from './constants'
export * from './modelConfig'
export * from './adapters'

type ActionApiCallConfig = ApiCallConfig & {
  url: string;
}

export interface LoadDataConfig {
  page?: number;
  filter?: {
    [key: string]: any;
  };
  sort?: string;
  parentEntities?: {
    [key: string]: RestifyId;
  }
  specialConfig?: boolean;
  modelConfig?: Partial<RestifyModelConfig>
  urlHash?: string;
}

export interface LoadByIdConfig extends GetByIdConfig {
  urlHash?: string;
  apiName?: string;
}

export interface DeleteByIdConfig {
  useOptimistic?: boolean;
}

export interface ApiActions extends ActionCreatorsMapObject {
  updateData<T> (
    data: T[],
    page: number,
    pageSize: number,
    count: number,
    filter: any,
    sort: any,
    parentEntities: string[],
    specialConfig: boolean,
    modelConfig: RestifyModelConfig,
  ): any;
  clearPages(): any;
  clearData(): any;
  updateById<T>(id: RestifyId, data: Partial<T>, query: RestifyQuery, allowClearPages?: boolean): any;
  updateFromRawData<T>(id: RestifyId, data: Partial<T>, query: RestifyQuery, allowClearPages?: boolean): any;
  updateOptimisticById<T>(id: RestifyId, data: Partial<T>, query: RestifyQuery): any;
  discardOptimisticUpdateById(id: RestifyId): any;
  setLoadErrorForId(id: RestifyId, error: any, query: RestifyQuery): any;
  loadData<T>(config: LoadDataConfig): any;
  loadNextPage<T>(config: LoadDataConfig): any;
  loadById(id: RestifyId, config?: LoadByIdConfig): any;
  deleteById(id: RestifyId, config?: DeleteByIdConfig): any;
}

export interface ApiSelectors {
  getEndpoint(state: any): RestifyEndpointInfo;
  getEntities<T>(state: any): RestifyEntityList<T>;
}

export namespace api {
  export const actions: {
    callGet(config: ActionApiCallConfig): any;
    callPost(config: ActionApiCallConfig): any;
    callPut(config: ActionApiCallConfig): any;
    callPatch(config: ActionApiCallConfig): any;
    callDel(config: ActionApiCallConfig): any;
    entityManager: {
      [key: string]: ApiActions;
    };
  };
  export const constants: {
    NAME: string;
    ACTIONS_TYPES: {
      loadsManager: {
        [key: string]: string;
      };
      entityManager: {
        [key: string]: string;
      };
    };
    CRUD_ACTIONS: {
      [key in CrudAction]: CrudAction;
    };
  };
  export function getRestifyApiReducer(): any;
  export const selectors: {
    entityManager: {
      [key: string]: ApiSelectors;
    };
    loadsManager: {
      getUrls(url: string, query?: RestifyQuery): (state: any) => any;
      getUrl(url: string, query?: RestifyQuery): (state: any) => any;
      getIsUploadingUrl(url: string, query?: RestifyQuery): (state: any) => boolean;
      getIsDownloadingUrl(url: string, query?: RestifyQuery): (state: any) => boolean;
      urlLoadsCount(url: string, query?: RestifyQuery): (state: any) => number;
      getUploadingUrlCount(url: string, query?: RestifyQuery): (state: any) => number;
      getDownloadingUrlCount(url: string, query?: RestifyQuery): (state: any) => number;
      getUrlLoadsCount(url: string, query?: RestifyQuery): (state: any) => number;
      getLoadingProgress(url: string, query?: RestifyQuery): (state: any) => number;
      getIsLoadingUrl(url: string, query?: RestifyQuery): (state: any) => boolean;
      getUploadsCount(state: any): number;
      getDownloadsCount(state: any): number;
      getIsUploading(state: any): boolean;
      getIsDownloading(state: any): boolean;
      getIsLoading(state: any): boolean;
    };
  }
}
