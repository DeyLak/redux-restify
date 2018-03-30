# Api module

Api module is based on api entities configs. You can describe available fields for each entitiy, add relations between them etc.

Module has the following structure:
```
{
  selectors: {
    loadsManager: {...},
    entityManager: {...},
  },
  actions: {
    loadsManager: {...},
    entityManager: {...},
  },
  getRestifyApiReducer: function(){...}
}
```

**loadsManager** is used for managering urls download and upload statuses. This is mostly used for displaying preloaders
**entityManager** is used for getting registered models from back-end, making RESfull CRUD actions with entities end other ORM-like staff.
**getRestifyApiReducer** is used for creating redux store reducer, see more in global options section

## Entity config
Simple entity config is a javascript object like
```javascript
{
  endpoint: 'entity/',
  defaults: {
    id: undefined,
    value: undefined,
    relatedModel: new RestifyForeignKey('otherModel'),
  },
}
```

## Available options for model config
* **pageSize** (default: undefined)
  Default page size for model, if not set, global default will be used
* **parent** (default: undefined)
  Parent entity name, or names array for related entities like /parent-entity/{id}/child-entity
* **endpoint** (default: ''),
  Endpoint for accessing this entity (without parents and api prefixes)
* **allowIdRequests** (default: true)
  You can disable attempts to load entity by id, if you don't have an endpoint for it and use it only for inner model structure, or load entitis only via list request
* **defaults** (default: { id: undefined }),
  Default values for entity from this endpoint(for components sync loading entities access)
* **pagination** (default: true)
  Does this entity has pagination for list requests
* **idField** (default: 'id')
  You can specify id field of the model, or calculate some id from the data, using function `item => id` for cases, when item has no id, or response list has id dublicates. Entity is required to have an id.
* **convertToCamelCase**  (default: true)
  Should the fields names from back-end be converted to camelCase notation
* **removeNulls** (default: true)
  Replace null values with undefined
* **orderArrays** (default: true)
  Sort arrays, if they have order field(see in global restify options)
* **clearDataOnRouteChange** (default: false)
  By default, only pages are being cleared on route changes, so requests will be repeated, to get fresh data. But sometimes, we want the entire data to be cleared and re-requested.
* **apiName** (default: 'default')
  Api name, from registeres apies list(see global restify options)

## Registering an entity
All entities should be registered in `initRestify` function call by passing `modelsDefinitions` key in options dic. It should be a dict with model configs, like:
```javascript
{
  myModel: {
    endpoint: 'my-endpoint/',
    defaults: {
      id: undefined,
      value: undefined,
    },
  },
  otherModel: {
    endpoint: 'other-endpoint/',
    defaults: {
      id: undefined,
      myModelLink: new RestifyForeignKey('myModel'),
    },
  },
}
```

## Defining model relations

Models can be linked to each other. This is making use of data normalization for nested apies, and also cares about auto-fetching fields, sent as ids of other entities.

### Core features:
* Normalizing nested data, saving single source of truth in store
* Opportunity to define some model field, wich is an object id, as a foreign key and call it as a nested entity
* Opportunity to get some field, wich is not loaded yet(for example, some entities lack some fields in array requests), restify will trigger a direct id request, and return data, as soon as it is ready

### Available relation classes
* **RestifyForeignKey** - simple model realtion, for example, user assigned to task
  usage: `new RestifyForeignKey('modelName')`
* **RestifyForeignKeysArray** - array of related models, for example, tasks in task board
  usage: `new ResifyForeignKeysArray('modelName')`
* **RestifyArray** - array of not-registered models with own nested structure for example, some wrapper entities with order and link to other entity
  usage:

```javascript
new RestifyArray({
  defaults: {
    order: undefined,
    linkedModel: new RestifyForeignKey('modelName'),
  },
})
```

### Example
Let's imagine, a simple application with 3 models.
**user** - user of the system
```javascript
{
  id: undefined,
  firstName: undefined,
  lastName: undefined,
}
```
**taskBoard** - tasks container(imagine canban flow columns)
```javascript
{
  id: undefined,
  title: undefined,
}
```
**task** - todo item
```javascript
{
  id: undefined,
  title: undefined,
  responsible: new RestifyForeignKey('user'),
  board: new RestifyForeignKey('taskBoard'),
}
```
we made a request to RESTfull endpoint `tasks/1`, which returns result like:
```json
{
  "id": 1,
  "title": "Test task",
  "responsible": {
    "id": 7,
    "first_name": "Ivan",
    "last_name": "Ivanov"
  },
  "board": 2,
}
```

If we get task restify model by id 1, we will get this object:
```javascript
{
  id: 1,
  title: "Test task",
  responsibleId: 7,
  responsible: { // This is lazy getter, it will get user entity by id from the store(cause we already recieved it)
    id: 7,
    firstName: 'Ivan',
    lastName: 'Ivanov',
  },
  boardId: 2,
  board: { // This is lazy getter, it will make a request to taskBoard endpoint and return entity fields as soon, as they are ready
    id: 2,
    title: 'Test board',
  },
}
```

## Selectors

### LoadsManager
`api.selectors.loadsManager` have the following selectors:
* **getEndpoint** - get endpoint, used for this entity

* **getIsUploading** - returnes true, if any write(POST, PATCH, DELETE) request is in progress, otherwise - false
* **getIsDownloading** - returnes true, if any read(GET) request is in progress, otherwise - false
* **getIsLoading** - returnes true, if any request is in progress, otherwise - false
* **getDownloadsCount** - returnes number of read requests in progress
* **getUploadsCount** - returnes number of write requests in progress
* **getIsDownloadingUrl(url, queryObject)** - creates a selector, that returnes true, if a read request for this url is in progress, if `queryObject` param is passed, url will be checked with query params, otherwise - only main part
* **getIsUploadingUrl(url, queryObject)** - same as `getIsDownloadingUrl`, but for write requests
* **getIsLoadingUrl(url, queryObject)** - same as `getIsDownloadingUrl`, but for all requests. **Warning:** do not use this method for getting info about restify entities loading. Use `getIsLoadingArray` and `getIsLoadingById` methods(see below).
* **getLoadingProgress(url, queryObject)** - creates a selector, that returnes XHR loading progress for this url and queryObject
* **getUploadingUrlCount(url, queryObject)** - creates a selector, that returnes number of write requests in proigress for this url
* **getDownloadingUrlCount(url, queryObject)** - creates a selector, that returnes number of read requests in proigress for this url
* **getUrlLoadsCount(url, queryObject)** - creates a selector, that returnes number of all requests in proigress for this url

### EntityManager

`api.selectors.entityManager` have same selectors structure for each registered model(for example: `api.selectors.entityManager.myModel.getEntities(state)`):
* **getEndpoint** - get endpoint, used for this entity
* **getEntities** - get `EntityList` object, wich incapsulates all entity logic, such as relations, getting arrays, filtering etc.

## EntityList api

### Array config
Array config is an object, used for array queries, such as getting loading states, getting entities arrays, getting global entities count in array etc.
Example:
```javascript
{
  filter: { isMine: true, statuses: ['NEW', 'IN_WORK'] },
  sort: 'title',
  parentEntities: {},
  specialConfig: false,
  pageSize: 10,
}
```
* **filter** (default: {})
Object, defines query params for array request, canaccept arrays and map them into `field=1&field=2` notation
* **sort** (default: undefined)
Value of sort query param(see global restify options)
* **parentEntities** (default: {})
If entity has a parent, this should be a dic of model names and their ids, for example `{ parentModel: 1}`
* **specialConfig** (default: false)
Do not save entities from this request as single source of truth, keep them inside the array, so they don't mess up loaded data. Can be useful sometimes, if some entity request is returning not default format
* **pageSize** (default: model pageSize)
Array request pageSize

### Array methods

* **getArray(arrayConfig)** - get entities list from RESTfull list request(usually `endpoint/`), returns array of restify model objects, combined from all loaded pages(by default - first page is requested autmatically, other pages should be requested via action(see below)
* **asyncGetArray(arrayConfig)** - same, as `getArray`, but returns a `Promise`, resolving with already loaded array. The main difference between this two methods, that the first one should be used in synchronous code, like render functions, so it will be returning empty arrays, till they won't be loaded, but in asynchronous code(usualy some action creators) we want to have array already loaded, so we can work with it.
* **getIsLoadingArray(arrayConfig)** - returnes `true`, if this configuration is currenly loading(any page number) and `false` otherwise.
* **getCount(arrayConfig)** - returns server entities count for this config(if api supports count field in array responses)
* **getNextPage(arrayConfig)** - returnes next available page number, that is not yet loaded for this config, or `undefined`, if no more pages left to load

### Single entity config
Single entity selector also accepts an optional config, like:

```
{
  query: {
    someQueryParam: 'test',
  },
  preventLoad: false,
  forceLoad: true,
}
```

* **query** - query params object, same as filter config in array
* **preventLoad** - dissalow request for entity, only return it, if it is already loaded
* **forceLoad** - make a request and update entity, even if entity is already loaded (**Warning**: do not use in render functions, cause it will cause infinite rerenders!)

### Default entity object
Restify default model object contains all fields, that we used in model config, so we can use it in render functions and do not check every field availability(for examples, arrays will be returned as `[]`, not as `undefine`, so we can safely use `map` functions). Also, default model object contains some special fields:
* **$error** - shows, if this id was requested and returned error(for example, 404)
* **$loading** - shows, if this id is being loaded now
* **$modelType** - string model name, useful for creating some universal componens for managering default objects(for example, CheckEntityLoaded component, that shows loading indicator, instead of children, if the model passed to it is being loaded). We can use `modelType`for displaying a message, like, ``${modelType} is loading...``

### Single entities methods

* **getById(id, entityConfig)** - returnes restify model for given id. Make a request and returnes default object, if this id is not loaded yet.
* **asyncGetById(id, entityConfig)** - same, as `getById`, but returns a `Promise`, resolving with model object. If object can't be loaded, due to an error, or `preventLoad` is passed, and object is not loaded yet, than returns `undefined`, cause it is easier to check in async code, that default objects, that are more usefull for rendering.
* **getIsLoadingById(id, entityConfig)** - returns `true`, if that entity is being loaded now, or `false` otherwise

## Actions

`api.actions` have same actions structure for each registered model(for example: `api.actions.myModel.deleteById(1)`):

* **clearPages()** - removes saved pages from store(only page ordering, not single entities). Usefull for making render functions, that are using array selectors, to re-request arrays
* **clearData()** - same, as `clearPages`, but also removes singleEntitis from store. **Warning:** you should prefer to use clearPages, cause removing single entities can cause many id requests, if some other entities are relying on that one.
* **loadData(config)** - config is same as arrayConfig, but accepts one more `page` field, that shows, wich page to load. This action loads given page and saves it to store.
* **loadNextPage(arrayConfig)** - load next available page(makes use of `getNextPage` EntityList method)
* **loadById(id, entityConfig)** - load entity by id and save it to store
* **deleteById(id)** - make `DELETE` RESfull request for given id
