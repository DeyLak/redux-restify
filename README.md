# redux-restify

This is a redux based framework for managering api entities and application forms.

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
