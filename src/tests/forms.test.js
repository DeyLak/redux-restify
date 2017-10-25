import forms from '../forms'

import { getNestedObjectField } from 'helpers/nestedObjects'

import {
  store,
  beforeEachFunc,
  TEST_API_HOST,
  TEST_API_PREFIX,
  TEST_MODEL_ENDPOINT,
} from './testConfigs'


describe('forms', () => {
  beforeEach(() => beforeEachFunc())

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
