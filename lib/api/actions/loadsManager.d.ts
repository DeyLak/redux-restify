export function addUpload(url: any, query: any): (dispatch: any, getState: any) => any;
export function removeUpload(url: any, query: any): (dispatch: any, getState: any) => any;
export function addDownload(url: any, query: any): (dispatch: any, getState: any) => any;
export function removeDownload(url: any, query: any): (dispatch: any, getState: any) => any;
export function setLoadingProgress(progress: any, url: any, query: any): {
    type: any;
    progress: any;
    url: any;
};
export function setLoadingError(error: any): {
    type: any;
    error: any;
};
