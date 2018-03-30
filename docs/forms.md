# Forms module

Forms module is based on forms configs. You can describe default form fields, differenet fields behaviours(like: reset on route change, transform form before submit), define validation rules, and also link a form to a restify api model(see below)

Module has the following structure:
```
{
  selectors: {...},
  actions: {...},
  constants: {
    DEFAULT_FIELD_FUNCTIONS: {...},
    ACTIONS_TYPES: {...},
  },
  getRestifyFormReducer: function(){...},
  createFormConfig: function(){...},
  getFormActions: function(){...},
  checkErrors: function(){...},

  // Validation presets:
  ValidationPreset: constructor(){},
  ValidationPresetCombine: constructor(){},
  ValidationPresetNotFalsy: constructor(){},
  ValidationPresetNotOneOf: constructor(){},
  ValidationPresetOneOf: constructor(){},
  ValidationPresetRequiered: constructor(){},
}
```

**createFormConfig** create a restify form config(initializes the form config with neccesary default values)
**getFormActions(formType)** returnes default actions structure for given `formType`(see below about form types)
**checkErrors(restifyErrorsObject)** returnes true, if errors object contains exceptions
**getRestifyFormReducer** is used for creating redux store reducer, see more in global options section

## Form config
Simple forms config is a javascript object like
```javascript
{
  endpoint: 'entity/',
  defaults: {
    name: undefined,
    value: undefined,
  },
}
```

### Available options for form config
* **baseConfig** (default: undefined)
  Form name, wich should be used as a base config(nest all properties, except ovverided ones). Usefull for creating configs of validation functions and other non-serializable and then using them for creating runtime forms(see below)
* **apiName** (default: undefined)
  Form api name from registered restify apies, so it's prefix and rules will be used for sending this form.
* **endpoint** (default: '')
  Endpoint to submit to server, can be either string, or function (formValues) => string
* **model** (default: '')
  Restify model, wich is linked to this form. If set, endpoint field is ignored, links form to api model, updates data according to RESTfull protocol. See more below
* **updateEntity** (default: true)
  Should linked restify model be updated by id, when submitting RESTfull form
* **id** (default: undefined)
  Entity id, which is used in RESTfull requests, like entities/{id}. Field is optional, also id field from form data is used by default
* **specialAction** (default: '')
  Postfix for model url, for some special-endpoints, like: entity/{id}/{action}
* **method** (default: undefined)
  Method to submit form, usually not necessary, cause RESTfull endpoints can self-define methods
* **submitExclude** (default: {})
  Dict should have form structure from defaults config(array fields should be presented as objects). If dict value is true, then that form field will not be submitted to server.
* **onRouteChangeReset** (default: {})
  Dict should have the same structure, as `submitExclude`, but is responsible for resetting fields to their default values on route change event
* **onRefreshReset** (default: {})
  Dict should have the same structure, as `submitExclude`, but is responsible for resetting fields to their default values on page refresh event
* **defaults** (default: {})
  Default values of the form fields. See more below.
* **values** (default: {})
  Initial values of the form fields. They can differ from default values, also, usefull for setting arrays values, wich currently can not be done with `defaults` config.
* **transformBeforeSubmit** (default: {})
  Performs form data transformation before sending it to server. Can be an object with form keys, that should be transformed (key, value, formValues) => newValue, or a function (formValues) => dataToSubmit
* **resetOnSubmit** (default: false)
  Reset all fields to their defaults after successfull submit. Can be usefull for reusable forms.
* **deleteOnSubmit** (default: false)
  Delete form after successfull submit. Useful for runtime forms.
* **convertToSnakeCaseBeforeSend** (default: true)
  All fields in form are converted to lower_snake_case before submit
* **convertResultToCamelCase** (default: true)
  Should back-end response result be converted to camelCase
* **resultRemoveNulls** (default: true)
  Should nulls be replaced with undefineds in result
* **resultOrderArrays** (default: true)
  Should arrays in result be reordered by order filed(see in global restify options)
* **validate** (default: undefined)
  Form validation definition. Can be object with keys with same path, as in forms, preset, or function of (currentLevelValue, formValues) => bool. If object is used, every node is following the same rules, as top-level preset or function
* **validateOnFieldChange** (default: true)
  Should form be validated after every field change
* **validateAll** (default: false)
  Should all registered form fields be validated, despite their presense in form values
* **validateOnSubmit** (default: true)
  Should form be validated before submitting. If validate failes, submit action will return rejected promise with errors object.
* **allowSendInvalid** (default: false)
  Overrides previous behaviour of not sending invalid form, so the form with errors can be send.
* **mapServerDataToIds** (default: false)
  When mapping server data to form(see `applyServerData` action), it maps foreign keys restify fields to ids

### Form defaults
Defaults object is used to define some form structure, so we should not check it every time, or to fill some fields for user. For example, arrays will be empty arrays(or can contain some default elements), selects will be already pre-selected with default choice etc.
Form defaults configuration can look like this:
```javascript
{
  ...
  defaults: {
    name: '',
    avatar: undefined,
  },
  ...
}
```

### Array defaults
* Arrays can contain their items defaults configuration like this:
```javascript
{
  ...
  defaults: {
    arrayField: [
      {
        itemField: undefined,
        itemSecondField: 'default value',
      },
    ],
  },
  ...
}
```
* Arrays have some special configurations, that can be passed in second element of array default like this:

```javascript
{
  ...
  defaults: {
    arrayField: [
      {
        itemField: undefined,
      },
      {
        count: 1,
        orderable: true,
        fakeId: true,
      },
    ],
  },
  ...
}
```
* **orderable** - adds each array item an order property, wich equals to element index in array, useful for independance from server array sorting
* **fakeId** - for new array instances generates an uuid in id field, but do not submit it to server
* **count** - deault count of items, added to array, when initializing default form object

## Registering a form
Form is a pare of formType(string form name), a uique form id, that is used to access the form, and form config.

### Boot-up time forms
Forms can be registered in `initRestify` function call by passing `formsDefinitions` key in options dic. It should be a dict with form configs, like:

```javascript
{
  myForm: {
    model: 'myModel',
    defaults: {
      name: undefined,
      value: undefined,
    },
  },
  otherForm: {
    endpoint: 'some-endpoint/',
    defaults: {
      data: undefined,
    },
  },
}
```
### Runtime forms
Forms also can be created at runtime. The main defference between boot-up time forms, and runtime forms is that boot-up time forms are always loaded in memory, cause their configs are created each time restify is loaded, and runtime forms are created only once, so their config is stored in redux store and should be serializable(as stated in redux docs). For using some non-serializable objects, such as validation functions, you should register a base boot-up time form and then create runtime forms based on it.
To create a runtime form you should call an action `createForm`(see below).

## Selectors

`forms.selectors` have same selectors structure for each registered form(for example: `forms.selectors.myForm.getForm(state)`). Also it has selector creators with same names, wich accept formType and return a selector(for example: `forms.selectors.getForm('myForm')(state)`). Only boot-up time forms have their selectors pre-created. Runtime forms should use selectors creators. If you want to create selectors for some formType, you can use `selectors.getFormSelectors(formType)`. Available selectors:
* **getIsFormExist** - returnes true, if a runtime form with that name is registered
* **getEndpoint** - returnes object, describing, wich endpoint is used to submit this form. Object structure is the following:

```javascript
{
  apiHost: 'restifyApiHost',
  apiPrefix: 'restifyApiPrefix',
  endpoint: 'formEndpoint',
}
```
* **getForm** - returnes object with form values. All nulls are replaced with undefines for consistency.
* **getFormWithNulls** - returnes object with form values. Null values are not changed.
* **getField(fieldName)** - creates a selector for getting specific field values from form.
* **getSavedField(fieldName)** - creates a selector for getting specific field saved state. Only works with fields, that are marked editable(see below)
* **getErrors** - get form errors object. It has the same strucure, as form, but contains arrays of error messages, instead of values.
* **getIsValid** - get is form valid
* **getEditingFields** - get object of saved fields states. It have the save structure, as form, but containes saved values of fields, that were marked editable(see below)

## Actions
* **forms.actions.createForm(formType, formConfig, allowRecreate=false)** - register new form in redux store. `allowRecreate` flag is used to show, if we allow to rewrite already existing config.
`forms.actions` have same actions structure for each registered form(for example: `forms.actions.myForm.submit`). Only boot-up time forms have their actions pre-created. Runtime forms should use `forms.getFormActions(formType)`. Available actions:
* **deleteForm()** - Deletes a runtime form
* **resetForm()** - Resets all fields to default values
* **renameForm(formType)** - Only works for runtime forms. Changes formType of the form.
* **changeField(fieldPath, newValue)** - chages form field value. `fieldPath` can be a string field name or an array of keys for nested form objects(like lodash array object notation).
* **changeSomeFields(fields)** - Same as `changeField`, but accepts dict with fields names and changes all of them.
* **applyServerData(restifyModel)** - Only for forms, linked to restify model. Fill form values with restify model data. Replaces foreign keys with ids, sort arrays, etc.
* **resetField(fieldPath)** - Changes field value to it's defaul
* **insertToArray(arrayPath, value, insetingIndex)** - Inserts a value into array. If object with missing keys is paseed, default values for fields will be used. If `insertingIndex` is not passed, then value will be pushed into array.
* **insertToArrayAndEdit(arrayPath, value, insetingIndex)** - Same, as `insertToArray`, but also markes the field as editable(see below)
* **removeFromArray(arrayPath, index, count)** - Removing values from array. Works as `splice`.
* **replaceInArray(arrayPath, value, index)** - Replace a value in array by index.
* **moveInArray(arrayPath, movingIndex, insertingIndex)** - Move an array element to a new position
* **moveInArrayUp(arrayPath, movingIndex)** - Move element one index up
* **moveInArrayDown(arrayPath, movingIndex)** - Move element one index down
* **setFieldError(fieldPath, error)** - Sets field error message. Affects `getIsValid` and `getErrors` selectors
* **resetFieldError(fieldPath)** - Resets field error message. Affects `getIsValid` and `getErrors` selectors
* **enableFieldEditMode(fieldPath)** - Saves field current state, so it can be easily rolled back. From this point the field will be marked as editing. It can be treated same, as others and will be send in it's last state, even if edit mode will not be switched off.
* **saveEditingField(fieldPath)** - Remove saved field satus, so the field will not be marked as editing.
* **cancelFieldEdit()** - Cancels field edit, so the field state is returned to saved state and editable mark is switched off.
* **validate()** - Returns errors object from form validation
* **submit()** - Submits a form, according to all config rules. Returnes a promise, resolving with server result, ot restify model, if the form is linked to restify.



