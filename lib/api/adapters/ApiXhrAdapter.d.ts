export default ApiXhrAdapter;
declare class ApiXhrAdapter {
    constructor({ getToken, getCSRFToken, getHeaders, apiHost, apiPrefix, dispatch, allowedNoTokenEndpoints, httpCodesCallbacks, defaultPageSize, deafultDateFormat, defaultSortField, transformArrayResponse, getEntityUrl, transformEntityResponse, transformErrorResponse, getGenericModel, getGenericFormField, getPaginationQuery, authMethod, withCredentials, useSnakeCase, alertAction, }: {
        getToken: any;
        getCSRFToken: any;
        getHeaders: any;
        apiHost: any;
        apiPrefix: any;
        dispatch: any;
        allowedNoTokenEndpoints?: any[] | undefined;
        httpCodesCallbacks?: {} | undefined;
        defaultPageSize?: any;
        deafultDateFormat?: any;
        defaultSortField?: any;
        transformArrayResponse: any;
        getEntityUrl?: (({ apiHost, apiPrefix, modelEndpoint, entityId, specialAction, }: {
            apiHost: any;
            apiPrefix: any;
            modelEndpoint: any;
            entityId: any;
            specialAction: any;
        }) => string) | undefined;
        transformEntityResponse: any;
        transformErrorResponse: any;
        getGenericModel?: ((fieldValue: any) => {
            modelType: any;
            model: any;
        }) | undefined;
        getGenericFormField?: ((model: any) => {
            _object: any;
            id: any;
        }) | undefined;
        getPaginationQuery: any;
        authMethod?: string | undefined;
        withCredentials?: boolean | undefined;
        useSnakeCase?: any;
        alertAction: any;
    });
    getToken: any;
    getCSRFToken: any;
    getHeaders: any;
    apiHost: any;
    apiPrefix: any;
    dispatch: any;
    allowedNoTokenEndpoints: any[];
    httpCodesCallbacks: {};
    defaultPageSize: any;
    deafultDateFormat: any;
    defaultSortField: any;
    transformArrayResponse: any;
    transformEntityResponse: any;
    transformErrorResponse: any;
    getPaginationQuery: any;
    getEntityUrl: ({ apiHost, apiPrefix, modelEndpoint, entityId, specialAction, }: {
        apiHost: any;
        apiPrefix: any;
        modelEndpoint: any;
        entityId: any;
        specialAction: any;
    }) => string;
    getGenericModel: (fieldValue: any) => {
        modelType: any;
        model: any;
    };
    getGenericFormField: (model: any) => {
        _object: any;
        id: any;
    };
    authMethod: string;
    withCredentials: boolean;
    useSnakeCase: any;
    alertAction: any;
    asyncDispatch(...args: any[]): Promise<any>;
    httpCallBackInvoke(api: any, makeRetry: any): void;
    /**
     * Make a call to some url, wrapper for xhr
     * @param  {string} baseUrl   base url, like api host
     * @param  {HttpMethod} argMethod HTTP method
     * @param  {{
        getEntityUrl: ({
          apiPrefix;
          modelEndpoint;
          entityId;
          crudAction;
          specialAction;
        }) => string;
        withoutPrefix: boolean;
        id: RestifyId;
        crudAction: CrudActions;
        specialAction: string;
        query: Record<string, any>;
        forceMethod: HttpMethods;
        data: Record<string, any>;
        urlHash: string;
        skipLoadsManager: boolean;
        isBinary: boolean;
        onXhrReady: (api: xhr) => void;
        retries: number;
        retryTimeoutMs: number;
     * }} config - request options
     * @return {Promise} promise of the request
     */
    callApi(baseUrl: string, argMethod: any, config: {
        getEntityUrl: {
            apiPrefix: any;
            modelEndpoint: any;
            entityId: any;
            crudAction: any;
            specialAction: any;
        };
        string: any;
        withoutPrefix: boolean;
        id: any;
        crudAction: any;
        specialAction: string;
        query: Record<string, any>;
        forceMethod: any;
        data: Record<string, any>;
        urlHash: string;
        skipLoadsManager: boolean;
        isBinary: boolean;
        onXhrReady: (api: any) => void;
        retries: number;
        retryTimeoutMs: number;
    }): Promise<any>;
    callGet(baseUrl: any, config: any): Promise<any>;
    callPost(baseUrl: any, config: any): Promise<any>;
    callPut(baseUrl: any, config: any): Promise<any>;
    callPatch(baseUrl: any, config: any): Promise<any>;
    callDel(baseUrl: any, config: any): Promise<any>;
}
