import { makeActionsBundle } from '~/helpers/actions'
import { RESTIFY_CONFIG } from '../config'
import { onRegisterForm } from '../init'


export const NAME = 'forms'

const actionsTypesForms = [
  'CHANGE_FIELD',
  'CHANGE_SOME_FIELDS',
  'RESET_FIELD',
  'SET_ERRORS',
  'SET_IS_VALID',
  'REMEMBER_FIELD_STATE',
  'SAVE_EDITING_FIELD',
]

const actionsTypesGeneralForms = actionsTypesForms.concat([
  'CREATE_FORM',
  'DELETE_FORM',
  'RESET_FORM',
  'RENAME_FORM',
])

export const GENERAL_FORMS_ACTIONS = '$general'
export const ACTIONS_TYPES = {
  [GENERAL_FORMS_ACTIONS]: makeActionsBundle(NAME, GENERAL_FORMS_ACTIONS, actionsTypesGeneralForms),
}
onRegisterForm(() => {
  RESTIFY_CONFIG.formsTypes.forEach((formType) => {
    ACTIONS_TYPES[formType] = makeActionsBundle(NAME, formType, actionsTypesForms)
  })
})

export const getActionType = formType => ACTIONS_TYPES[formType] || ACTIONS_TYPES[GENERAL_FORMS_ACTIONS]

export { DEFAULT_FIELD_FUNCTIONS } from './formConfig'
