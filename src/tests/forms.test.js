import forms from '../forms'

import { getNestedObjectField } from 'helpers/nestedObjects'

import {
  store,
  beforeEachFunc,
  TEST_API_HOST,
  TEST_API_PREFIX,
  TEST_MODEL_ENDPOINT,

  modelUrl,
} from './testConfigs'


const functionEquality = (first, second) => {
  if (typeof first === 'function' && typeof second === 'function') {
    return first.toString() === second.toString()
  }
  return undefined
}

describe('forms', () => {
  beforeEach(() => {
    jasmine.addCustomEqualityTester(functionEquality)
    beforeEachFunc()
  })

  it('returns endpoint', () => {
    const endpoint = forms.selectors.testForm.getEndpoint()
    expect(endpoint).toEqual({
      apiHost: TEST_API_HOST,
      apiPrefix: TEST_API_PREFIX,
      endpoint: TEST_MODEL_ENDPOINT,
    })
  })

  it('changes a field with name(array or string path)', () => {
    const fieldNames = [
      'fieldName',
      ['firstName', 'secondName'],
    ]
    const fieldValue = 'fieldValue'

    fieldNames.forEach(name => {
      store.dispatch(forms.actions.testForm.changeField(name, fieldValue))
      const state = store.getState()
      const form = forms.selectors.testForm.getForm(state)
      expect(getNestedObjectField(form, name)).toEqual(fieldValue)
    })
  })

  it('can return forms by RegExp', () => {
    const formRegExp = /^test/
    const state = store.getState()

    const formsObjects = forms.selectors.getFormsByRegExp(formRegExp)(state)
    expect(Object.keys(formsObjects)).toEqual([
      'testForm',
      'testRequestFormId',
      'testRequestFormOtherId',
    ])
    Object.keys(formsObjects).forEach(key => {
      expect(formsObjects[key]).toEqual(forms.selectors.getForm(key)(state))
    })
  })

  it('can get forms actions from formName, or from array', () => {
    const singleFormActions = forms.getFormActions('testRequestFormOtherId')
    expect(singleFormActions).toEqual(forms.actions.testRequestFormOtherId)

    const formRegExp = /^test/
    const state = store.getState()

    const formsObjects = forms.selectors.getFormsByRegExp(formRegExp)(state)
    const multiFormsAction = forms.getFormActions(Object.keys(formsObjects))
    Object.keys(formsObjects).forEach(key => {
      expect(multiFormsAction[key]).toEqual(forms.actions[key])
    })
  })

  it('changes a some fields with object', () => {
    const values = [
      {
        firstFieldName: 'firstFieldValue',
        secondFieldName: 'secondFieldValue',
      },
      {
        firstFieldName: 'firstFieldValue',
        secondFieldName: undefined,
      },
      {
        firstFieldName: undefined,
        secondFieldName: undefined,
      },
    ]

    values.forEach(fields => {
      store.dispatch(forms.actions.testForm.changeSomeFields(fields, true))
      Object.keys(fields).forEach(key => {
        const state = store.getState()
        const form = forms.selectors.testForm.getForm(state)
        expect(getNestedObjectField(form, key)).toEqual(fields[key])
      })
    })
  })

  it('changes an array and maintain order fields)', () => {
    const arrayToChange = [{ test: true }, { test: false }]
    const arrayToCheck = [{ test: true, order: 0 }, { test: false, order: 1 }]
    const arrayToCheckReverse = [{ test: false, order: 0 }, { test: true, order: 1 }]

    const actions = [
      forms.actions.testForm.changeField('testArray', arrayToChange),
      forms.actions.testForm.changeField('testArray', [...arrayToChange].reverse()),
      forms.actions.testForm.changeSomeFields({ testArray: arrayToChange }),
      forms.actions.testForm.changeSomeFields({ testArray: [...arrayToChange].reverse() }),
    ]

    actions.forEach((action, index) => {
      store.dispatch(action)
      const state = store.getState()
      const form = forms.selectors.testForm.getForm(state)
      expect(form.testArray).toEqual(index % 2 ? arrayToCheckReverse : arrayToCheck)
    })
  })

  it('can set default count for array fields)', () => {
    const state = store.getState()
    const form = forms.selectors.arrayTestForm.getForm(state)
    expect(form.arrayField).toEqual(new Array(5).fill(0).map(() => ({ test: true })))
  })
})

const customOrderField = 'customOrder'
describe('forms', () => {
  beforeEach(() => beforeEachFunc({ options: { orderableFormFieldName: customOrderField } }))

  it('can order arrays by any field', () => {
    store.dispatch(forms.actions.testForm.insertToArray('testArray'))
    const state = store.getState()
    const form = forms.selectors.testForm.getForm(state)
    expect(form.testArray[0][customOrderField]).toEqual(0)
    expect(form.testArray[0].order).toBe(undefined)
  })
})

describe('forms', () => {
  beforeEach(() => {
    beforeEachFunc()
    jasmine.Ajax.install()
  })

  afterEach(() => {
    jasmine.Ajax.uninstall()
  })

  it('Can transform fields before sending them', () => {
    jasmine.Ajax.stubRequest(modelUrl).andReturn({
      status: 200,
      responseText: JSON.stringify({}),
      responseHeaders: [
        {
          name: 'Content-type',
          value: 'application/json',
        },
      ],
    })
    store.dispatch(forms.actions.testForm.submit())
    const request = jasmine.Ajax.requests.mostRecent()
    expect(request.data()).toEqual({
      transformed_field: true,
      test: true,
      test_array: [],
    })
  })

  it('Can send array, by using transform function', () => {
    jasmine.Ajax.stubRequest(modelUrl).andReturn({
      status: 200,
      responseText: JSON.stringify({}),
      responseHeaders: [
        {
          name: 'Content-type',
          value: 'application/json',
        },
      ],
    })
    store.dispatch(forms.actions.arrayTestForm.submit())
    const request = jasmine.Ajax.requests.mostRecent()
    expect(request.data()).toEqual(new Array(5).fill(0).map(() => ({ test: true })))
  })
})
