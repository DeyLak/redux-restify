# redux-restify

This is a redux based framework for managering api entities and application forms.

Check out the [docs](./docs) for more info.

## Change log

### 04.10.2017
 1. Added `validateAll` form config option

### 10.10.2017
 1. Added error message for bad-set pagination property

### 25.10.2017
 1. Added orderableFormFieldName to options. No forms and arrays can be ordered by any field.
 2. Added getEndpoint() selector to models and forms
 3. Added opporunity to load model by empty id(for singltone models - just loads the endpoint and save the schema)

### 31.10.2017
 1. Fixed unregistered field warning for custom idField
 2. Added `transformBeforeSubmit` option to form config

### 2.11.2017
 1. Added `getByUrl` and `asyncGetByUrl` methods to EntityList. Also, you can define `apiName` in config

### 7.11.2017
 1. `transformBeforeSubmit` can be a function (formValues) => data. Can be used to send arrays

### 9.11.2017
 1. Added opportunity to pass RegExp to `getForm`(and others) selectors. Returns object with matched form name keys
 2. Added opportunity to pass form names array to `getFormActions`. Returns object with form name keys

### 19.11.2017
 1. Now `RestifyForeignKey` and `RestifyForeignKeysArray` can be set for plain id fields, or even for changing behaviour from model to id fields. They will return model by auto-request anyway
 2. Added `mapServerDataToIds` option to form config. `applyServerData` now can respects form model field and map models into ids for sending to server

### 23.11.2017
 1. Added `allowIdRequests` option to api model

### 30.11.2017
 1. `getToken` can now return Promise

### 20.12.2017
 1. Now `getIsLoadingById` and `getIsLoadingArrray` returns true, if the url is not registered in `loadsManager`

### 20.02.2018
 1. Now `allowNested` param for foreign key respects all models, not only self-recursive

### 06.03.2018
 1. Added `clearData` action to entityManager, so we can clear all api data for model. Useful for cases, when we want to forget some corrupted entities loaded.
 2. Added `clearDataOnRouteChange` setting for model, so we can clear all model data on route changes

### 04.04.2018
 1. Added `fetchConfig` to RestifyLinkedModel. This config will be applied in linkedModel.getById(<PK>, fetchConfig)

### 13.04.2018
 1. Added `transformArrayResponse` and `getEntityUrl` to api and model configs

### 17.04.2018
 1. Added `crudAction` and `specialAction` to `getEntityUrl`, now `getEntityUrl` can return an object with utl and method
 2. Added `transformEntityResponse` to api and model configs

### 19.04.2018
 1. Added `$modelType` field to all restify models

### 24.04.2018
 1. Added `clearPagesOnRouteChange` setting for model, so we can config default clearing pages on route changes

### 21.05.2018
 1. Added `modelConfig` setting for `getArray` and other array getters, allowing to tweak model config for given request

### 19.06.2018
 1. Added `RestifyField` base field class. Does not have any functionality yet, but can be used to give a field a verbose name and default values
 2. Added `warnAboutUnregisteredFields` option to model config

### 04.07.2018
 1. Added `onXhrReady` callback for api calls

### 27.07.2018
 1. Added `RestifyGenericForeignKey` for gereric relations

### 31.08.2018
 1. Added `forceLoad` option for arrays

### 27.09.2018
 1. Added `getPaginationQuery` option for model and api config

### 01.11.2018
 1. Added `getHeaders` option for xhr adapter

### 07.11.2018
 1. Added `trasformedValues` argument to `transformBeforeSubmit` function, so you can use values with applied fakeId, submitExclude and other default transforms

### 26.11.2018
 1. Added `query` param into form config, so you can send forms to endpoints with query params
 2. Added `authMethod` option to api config

### 30.11.2018
 1. Added `withCredentials` param for api config

### 02.11.2018
 1. Added `skipLoadsManager` config param for grneral api actions

### 06.11.2018
 1. Added `useSnakeCase` api parameter, so we can disable snake_case convertation for api

### 09.11.2018
 1. Now `asyncGetById` also has async getters for missing model fields

### 23.04.2019
 1. Now creating a new entity clears pages carefully, caching old version and serving it, while new request is in process

### 28.04.2019
 1. Added typescript typings

### 01.07.2019
 1. Added `transformErrorResponse` function

### 05.07.2019
 1. Added `useOptimisticUpdate` config to form

### 20.07.2019
 1. Added `parentEntities` config to getById

### 02.08.2019
 1. Added `hasById` selector

### 09.08.2019
 1. Added `key` and `data` params to generic fields

### 12.08.2019
 1. Added config and `useOptimistic` parameter to `deleteById` action. Use, if you want to show element deletion progress.

### 13.08.2019
 1. Added modelName parameter to transform Response functions

### 24.10.2019
 1. Added `retries` `retryTimeoutMs` options to restify config, so user can define default reties behaviour
