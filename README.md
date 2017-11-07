# redux-restify

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
