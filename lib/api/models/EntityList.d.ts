export default EntityList;
/**
 * Abstraction class for backernd RESTfull entities.
 * It can:
 * 1. Get entity by id synchronously
 * (due to redux updates it will futher replace loading value with recieved from server)
 * 2. Get entities list with any sorting and filtering(if backend can handle it) the same way
 * 3. Handle pagination for entities lists with every filter and sorting config
 * 4. Get all the same entities and lists asynchronously
 * so you don't need to manage some special loading objects in your code, wich can be usefull for components, but
 * absolutelly useless for async actions
 *
 * Important notes on some contracts with backend:
 * 1. Every RESTfull entity has an int id field for tracking
 * 2. Every RESTfull entity has a bolean deleted field for determine deleted entities
 *
 * API-framework related fields, that can be presented in objects:
 * bool: $loading - entity is loading now
 * bool: $error - there is an error, while loading entity. For now, these use cases are not well-documented
 * bool: $old - data is loading at the moment, but model has old data available in it
 * str: $modelType - model name, to determine, wich model object is related to, can be usefull for abstract components
*/
declare class EntityList {
    /**
     * @param {string|Object} modelType - Restify registered entity name, or other EntityList object to create a copy
     */
    constructor(modelType: string | Object);
    dispatch: any;
    asyncDispatch: any;
    modelType: any;
    modelConfig: any;
    apiConfig: any;
    pages: any;
    oldPages: any;
    singles: any;
    oldSingles: any;
    errors: any;
    errorsPages: any;
    urls: any;
    count: any;
    idMap: any;
    pageSize: any;
    linkedModelsDict: any;
    arrayLoaded: any;
    idLoaded: any;
    errorsLoaded: any;
    $arrays: {} | undefined;
    $oldArrays: {} | undefined;
    precalculatedSingles: {};
    setDispatch(dispatch: any): void;
    checkShouldLoadById(preventLoad: any, specialId: any): any;
    getRestifyModel(normalized: any, { isNestedModel, asyncGetters, parentEntities, preventLoad, preventAutoGetters, }?: {
        isNestedModel?: boolean | undefined;
        asyncGetters: any;
        parentEntities: any;
        preventLoad?: boolean | undefined;
        preventAutoGetters?: boolean | undefined;
    }, fields?: {}): any;
    getDefaulObject(id: any, fields?: {}, config?: {}): any;
    hasById(id: any, config?: {}): boolean;
    getById(id: any, config?: {}): any;
    /**
     * Check, if the given entity is loading from server.
     * @param  {number|string} id - entity id
     * @param  {Object} [config={}] - config
     * @param  {Object} [config.query] - entity specific query, like grouping or filtering
     * @return {Boolean} Is the entity loading.
     */
    getIsLoadingById(id: string | number, config?: {
        query?: Object;
    } | undefined): boolean;
    asyncGetById(id: any, config?: {}): Promise<any>;
    getByUrl(url: any, config?: {}): any;
    asyncGetByUrl(url: any, config?: {}): Promise<any>;
    getCalculatedArray(pages: any): {};
    get oldArrays(): {};
    get arrays(): {};
    setSource(pages: any, oldPages: any, singles: any, oldSingles: any, errors: any, errorsPages: any, count: any, urls: any, linkedModelsDict: any): void;
    clearData(): void;
    getNextPage({ filter, sort, parentEntities, specialConfig, modelConfig, }?: {
        filter?: {} | undefined;
        sort: any;
        parentEntities?: {} | undefined;
        specialConfig?: boolean | undefined;
        modelConfig?: {} | undefined;
    }): number | undefined;
    getCount({ filter, sort, parentEntities, specialConfig, modelConfig, }?: {
        filter?: {} | undefined;
        sort: any;
        parentEntities?: {} | undefined;
        specialConfig?: boolean | undefined;
        modelConfig?: {} | undefined;
    }): any;
    getArray({ filter, sort, parentEntities, specialConfig, modelConfig, forceLoad, }?: {
        filter?: {} | undefined;
        sort: any;
        parentEntities?: {} | undefined;
        specialConfig?: boolean | undefined;
        modelConfig?: {} | undefined;
        forceLoad?: boolean | undefined;
    }): any;
    /**
     * Check, if the given entity list is being loaded from server
     * @param  {Object} [config] - api config
     * @param  {Object} [config.filter={}] - server filtering options
     * @param  {string} [config.sort] - server sorting option
     * @param  {Object} [config.parentEntities={}] - dict by entity name with parent entities id's
     * @param  {Boolean} [specialConfig=false] - entities from this array should only be available for this config
     * @return {Boolean} Is the array loading.
     */
    getIsLoadingArray({ filter, sort, parentEntities, specialConfig, modelConfig, }?: {
        filter?: Object;
        sort?: string;
        parentEntities?: Object;
    } | undefined): boolean;
    asyncGetArray({ filter, sort, parentEntities, specialConfig, modelConfig, forceLoad, }?: {
        filter?: {} | undefined;
        sort: any;
        parentEntities?: {} | undefined;
        specialConfig?: boolean | undefined;
        modelConfig?: {} | undefined;
        forceLoad?: boolean | undefined;
    }): Promise<any>;
}
