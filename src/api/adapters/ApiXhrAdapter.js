import { objectToCamel } from 'helpers/namingNotation'
import * as actions from '../actions/loadsManager'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_API_SORT_FIELD,
  DEFAULT_BACKEND_DATE_FORMAT,
  queryFormat,
} from '../constants'


const CONTENT_TYPE_HEADER = 'Content-type'
const ACCEPT_HEADER = 'Accept'
const AUTH_HEADER = 'Authorization'
const CSRF_HEADER = 'X-CSRF-Token'

const CONTENT_TYPE_JSON = 'application/json'
const CONTENT_TYPE_HTML = 'text/html'

const allow = [200, 201, 203, 204, 400, 401, 403]

const checkStatus = (api, config) => {
  if (allow.includes(api.status)) {
    const responseType = api.getResponseHeader(CONTENT_TYPE_HEADER)
    if (config.isBinary) {
      return api.response
    }
    if (responseType && responseType.includes(CONTENT_TYPE_JSON) && api.responseText && api.responseText !== '') {
      const result = JSON.parse(api.responseText)
      return config.convertToCamelCase ? objectToCamel(result, config) : result
    }
    if (responseType && responseType.includes(CONTENT_TYPE_HTML)) {
      return api.responseText
    }
  }
  if (api.status === 404) return null
  return undefined
}

const defaultGetEntityUrl = ({
  apiHost,
  apiPrefix,
  modelEndpoint,
  entityId,
  specialAction,
}) => {
  const baseUrl = `${modelEndpoint}${entityId || ''}${entityId ? '/' : ''}${specialAction || ''}`
  const slash = baseUrl.endsWith('/') || baseUrl.includes('?') ? '' : '/'
  return `${apiHost}${apiPrefix}${baseUrl}${slash}`
}

class ApiXhrAdapter {
  constructor({
    getToken, // Function () => apiToken (string)
    getCSRFToken, // Function () => CSRFToken (string)
    apiHost, // Host of current api
    apiPrefix, // Api url prefix for all api request, for ex: /api/v1.0
    dispatch, // redux dispatch for loadsManager and callbacks actions
    allowedNoTokenEndpoints = [], // Array of endpoints, that can be called without token
    // Dict of actions dispatched on special http response codes, for ex: { 403: logout }
    // Also can be a function (code) => dict or action to dispatch
    httpCodesCallbacks = {},
    defaultPageSize = DEFAULT_PAGE_SIZE, // Default page size for lists requests
    deafultDateFormat = DEFAULT_BACKEND_DATE_FORMAT, // Default date format for formatting moment objects
    defaultSortField = DEFAULT_API_SORT_FIELD, // Default query param name for sorting option
     // Transform array server response into restify array info(elements, count etc)
     // (response, pagination) => ({ data: [], count: 1, page: 1})
     // pagination is user-defined propery of model, that describes, if model has pagination
     // response is a pure server response(only converted to camelCase)
     // data should be an array of model objects
     // count should represent all objects count, that are available on server (if api provides such field)
     // page is number of page in server pagination(if api provides such field)
    transformArrayResponse,
    // Get custom url for manipulating entity CRUD
    // ({apiHost, apiPrefix, modelEndpoint, entityId, crudAction, specialAction}) => 'url'
    getEntityUrl = defaultGetEntityUrl,
    // Transform single entity server response into restify model info(model data from server)
    // (response) => ({ data: {} })
    // should return an object with data field, that can be mapped into restify entity
    transformEntityResponse,

    // @deprecated this api is very poor constructed and should not be used
    alertAction, // TODO by @deylak need to think of entities CRUD callback api
  }) {
    this.getToken = getToken
    this.getCSRFToken = getCSRFToken
    this.apiHost = apiHost
    this.apiPrefix = apiPrefix
    this.dispatch = dispatch
    this.allowedNoTokenEndpoints = allowedNoTokenEndpoints
    this.httpCodesCallbacks = httpCodesCallbacks
    this.defaultPageSize = defaultPageSize
    this.deafultDateFormat = deafultDateFormat
    this.defaultSortField = defaultSortField
    this.transformArrayResponse = transformArrayResponse
    this.transformEntityResponse = transformEntityResponse
    this.getEntityUrl = getEntityUrl

    this.alertAction = alertAction
  }

  httpCallBackInvoke(api) {
    let currentCodes = this.httpCodesCallbacks
    if (typeof this.httpCodesCallbacks === 'function') {
      currentCodes = this.httpCodesCallbacks(api.status)
    }

    if (typeof currentCodes === 'function') {
      this.dispatch(currentCodes())
    } else if (typeof currentCodes === 'object' && currentCodes[api.status]) {
      this.dispatch(currentCodes[api.status]())
    }
  }

  callApi(baseUrl, argMethod, config) {
    const method = argMethod.toUpperCase()
    return new Promise(async (res, rej) => {
      const api = new XMLHttpRequest()
      let CSRFToken

      if (typeof this.getCSRFToken === 'function') {
        CSRFToken = this.getCSRFToken()
      }
      if (CSRFToken instanceof Promise) {
        CSRFToken = await CSRFToken
      }

      let token = this.getToken()
      if (token instanceof Promise) {
        token = await token
      }
      const isTokenRequired = !this.allowedNoTokenEndpoints.some(endpoint => {
        if (typeof endpoint === 'string') return endpoint === baseUrl
        if (endpoint instanceof RegExp) return endpoint.test(baseUrl)
        return false
      })
      if (!token && isTokenRequired) {
        console.warn(`Called ${baseUrl} which requires token, but there was no token found!`)
        rej({ status: 401 })
        return
      }
      let url = (config.getEntityUrl || this.getEntityUrl)({
        apiHost: this.apiHost,
        apiPrefix: config.withoutPrefix ? '/' : this.apiPrefix,
        modelEndpoint: baseUrl,
        entityId: config.id,
        crudAction: config.crudAction,
        specialAction: config.specialAction,
      })
      let methodToUse = method
      if (typeof url === 'object') {
        methodToUse = url.method
        url = url.url
      }
      if (config.query && Object.keys(config.query).length) {
        url += `?${queryFormat(config.query, { dateFormat: this.deafultDateFormat })}`
      }
      api.open((config.forceMethod || methodToUse).toUpperCase(), url)
      // TODO by @deylak add more thoughtful headers configuration,
      // For now it's just a hack for some browsers sending wrong accept headers, causing DRF to return browsable api
      api.setRequestHeader(ACCEPT_HEADER, '*/*')
      if (token) {
        api.setRequestHeader(AUTH_HEADER, `Token ${token}`)
      }
      if (CSRFToken) {
        api.setRequestHeader(CSRF_HEADER, CSRFToken)
      }

      let form
      let filename
      if (config.data) {
        const dataArr = Object.entries(config.data)
        const checkFile = dataArr.some(val => {
          if (val[1] instanceof Blob) {
            if (val[1] instanceof File) {
              filename = val[1].name
            }
            return true
          }
          return false
        })
        if (checkFile) {
          form = new FormData()
          dataArr.forEach(([key, val]) => {
            if (val instanceof Blob && !(val instanceof File)) {
              form.append(key, val, 'blob.jpg')
            } else {
              form.append(key, val)
            }
          })
        } else {
          form = JSON.stringify(config.data)
          api.setRequestHeader(CONTENT_TYPE_HEADER, `${CONTENT_TYPE_JSON}; charset=utf-8`)
        }
      }
      let urlQuery = config.urlHash
      if (!urlQuery && (config.query || filename)) {
        urlQuery = {
          ...config.query,
          filename,
        }
      }
      const addLoadAct = method === 'GET' ? actions.addDownload : actions.addUpload
      const removeLoadAct = method === 'GET' ? actions.removeDownload : actions.removeUpload
      let firedMutex
      const fireLoadActIfNotfiredMutex = () => {
        if (!firedMutex) {
          this.dispatch(addLoadAct(baseUrl, urlQuery))
          firedMutex = true
        }
      }
      api.upload.onprogress = (e) => {
        fireLoadActIfNotfiredMutex()
        const progress = (e.loaded / e.total) * 100
        this.dispatch(actions.setLoadingProgress(progress, baseUrl, urlQuery))
      }
      api.onloadstart = fireLoadActIfNotfiredMutex
      api.onload = () => {
        this.dispatch(removeLoadAct(baseUrl, urlQuery))
        this.httpCallBackInvoke(api)
        res({
          status: api.status,
          data: checkStatus(api, config),
        })
      }
      api.onerror = (e) => {
        this.dispatch(removeLoadAct(baseUrl, urlQuery))
        this.dispatch(actions.setLoadingError(e.error))
        this.httpCallBackInvoke(api)

        let responseText = api.responseText
        if (api.status < 100) {
          responseText = ''
        }

        rej({
          status: api.status,
          data: JSON.parse(responseText || '{}'),
        })
      }
      if (config.isBinary) {
        api.responseType = 'arraybuffer'
      }
      api.send(form)
    })
  }

  callGet(baseUrl, config) {
    return this.callApi(baseUrl, 'GET', config)
  }

  callPost(baseUrl, config) {
    return this.callApi(baseUrl, 'POST', config)
  }

  callPut(baseUrl, config) {
    return this.callApi(baseUrl, 'PUT', config)
  }

  callPatch(baseUrl, config) {
    return this.callApi(baseUrl, 'PATCH', config)
  }

  callDel(baseUrl, config) {
    return this.callApi(baseUrl, 'DELETE', config)
  }
}

export default ApiXhrAdapter
