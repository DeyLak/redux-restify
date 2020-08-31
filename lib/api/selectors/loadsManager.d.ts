export function getLoadsManager(state: any): any;
export function getUrls(url: any, query: any): import("reselect").OutputSelector<any, any[], (res: any) => any[]>;
export function getUrl(url: any, query: any): (state: any) => any;
export function getIsUploadingUrl(url: any, query: any): (state: any) => boolean;
export function getIsDownloadingUrl(url: any, query: any): (state: any) => boolean;
export function urlLoadsCount(type: any): (url: any, query: any) => (state: any) => any;
export function getUploadingUrlCount(url: any, query: any): (state: any) => any;
export function getDownloadingUrlCount(url: any, query: any): (state: any) => any;
export function getUrlLoadsCount(url: any, query: any): (state: any) => any;
export function getLoadingProgress(url: any, query: any): (state: any) => any;
export function getIsLoadingUrl(url: any, query: any): (state: any) => boolean;
export const getUploadsCount: import("reselect").OutputSelector<any, number, (res: any) => number>;
export const getDownloadsCount: import("reselect").OutputSelector<any, number, (res: any) => number>;
export const getIsUploading: import("reselect").OutputSelector<any, boolean, (res: number) => boolean>;
export const getIsDownloading: import("reselect").OutputSelector<any, boolean, (res: number) => boolean>;
export const getIsLoading: import("reselect").OutputSelector<any, boolean, (res1: boolean, res2: boolean) => boolean>;
