export function callApi(method: any): ({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}) => (dispatch: any) => any;
export function callGet({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}): (dispatch: any) => any;
export function callPost({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}): (dispatch: any) => any;
export function callPut({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}): (dispatch: any) => any;
export function callPatch({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}): (dispatch: any) => any;
export function callDel({ apiName, url, onSuccess, onError, ...other }: {
    [x: string]: any;
    apiName?: any;
    url: any;
    onSuccess: any;
    onError: any;
}): (dispatch: any) => any;
export function resetEntityManager(): (dispatch: any) => any;
