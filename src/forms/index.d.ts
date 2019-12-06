import { ActionCreatorsMapObject } from 'redux'

import { RestifyFormConfig } from './formConfig'

import { RestifyEndpointInfo, RestifyModel } from '../api'

import { ThunkActionResult } from '../constants'


export { RestifyFormConfig } from './formConfig'

export * from './validation'

export type FormPath = string | number | (string | number)[]

export interface FormSubmitResult<T> {
  data: T;
  status: number;
}

export interface RestifyFormActions<T = any, LinkedModel = T> extends ActionCreatorsMapObject {
  deleteForm(): ThunkActionResult<void>;
  resetForm(): ThunkActionResult<void>;
  renameForm(formName: string): ThunkActionResult<void>;
  changeField(name: FormPath, newValue: any): ThunkActionResult<void>;
  changeSomeFields(fieldsObject: Partial<T>, forceUndefines?: boolean): ThunkActionResult<void>;
  applyServerData(data: any): ThunkActionResult<void>;
  resetField(name: FormPath): ThunkActionResult<void>;
  insertToArray(arrayName: FormPath, value?: any, insertingIndex?: number): ThunkActionResult<void>;
  insertToArrayAndEdit(arrayName: FormPath, value?: any, index?: number): ThunkActionResult<void>;
  manageSavedFieldArrayDeletion(arrayName: FormPath, index: number): ThunkActionResult<void>;
  manageSavedFieldArrayInsertion(arrayName: FormPath, index: number, insertedField: any): ThunkActionResult<void>;
  removeFromArray(arrayName: FormPath, index?: number, count?: number): ThunkActionResult<void>;
  replaceInArray(arrayName: FormPath, value: any, index: number): ThunkActionResult<void>;
  moveInArray(arrayName: FormPath, movingIndex: number, insertingIndex: number): ThunkActionResult<void>;
  moveInArrayUp(arrayName: FormPath, movingIndex: number): ThunkActionResult<void>;
  moveInArrayDown(arrayName: FormPath, movingIndex: number): ThunkActionResult<void>;
  changeInArray(arrayName: FormPath, name: string, value: any, index: number): ThunkActionResult<void>;
  setDirtyState(value: Partial<Record<keyof T, boolean>>): ThunkActionResult<void>;
  resetDirtyState(): ThunkActionResult<void>;
  setFieldDirtyState(name: FormPath, value: boolean): ThunkActionResult<void>;
  resetFieldDirtyState(name: FormPath): ThunkActionResult<void>;
  setErrors(value: any): ThunkActionResult<void>;
  resetErrors(): ThunkActionResult<void>;
  setFieldError(name: FormPath, value: any): ThunkActionResult<void>;
  resetFieldError(name: FormPath): ThunkActionResult<void>;
  resetArrayErrors(arrayName: FormPath, index: number): ThunkActionResult<void>;
  setArrayFieldErrors(arrayName: FormPath, name: string, value: any, index: number): ThunkActionResult<void>;
  resetArrayFieldErrors(arrayName: FormPath, name: string, index: number): ThunkActionResult<void>;
  rememberFieldState(name: FormPath, value: any): ThunkActionResult<void>;
  enableFieldEditMode(name: FormPath): ThunkActionResult<void>;
  saveEditingField(name: FormPath): ThunkActionResult<void>;
  validate(): ThunkActionResult<any>;
  cancelFieldEdit(name: FormPath): ThunkActionResult<void>;
  submit(): ThunkActionResult<Promise<FormSubmitResult<RestifyModel<LinkedModel>>>>;
}

export type RestifyFormErrors<T> = any

type FormTypeSelector = string | RegExp

type GetIsFormExist = (state: any) => boolean;
type GetEndpoint = (state: any) => RestifyEndpointInfo;
type GetForm = <T>(state: any) => T;
type GetFormWithNulls = <T>(state: any) => T;
type GetField = <T>(name: string) => (state: any) => T;
type GetSavedField = <T>(name: string) => (state: any) => T;
type GetErrors = <T>(state: any) => RestifyFormErrors<T>;
type GetIsValid = (state: any) => boolean;
type GetEditingFields = <T>(state: any) => Partial<T>;
type GetDirtyFields = <T>(state: any) => Record<keyof T, boolean>;
type GetIsDirty = <T>(state: any) => boolean;

export interface FormSelectors {
  getIsFormExist: GetIsFormExist;
  getEndpoint: GetEndpoint;
  getForm: GetForm;
  getFormWithNulls: GetFormWithNulls;
  getField: GetField;
  getSavedField: GetSavedField;
  getErrors: GetErrors;
  getIsValid: GetIsValid;
  getDirtyFields: GetDirtyFields;
  getIsDirty: GetIsDirty;
  getEditingFields: GetEditingFields;
}

export namespace forms {
  export const actions: {
    deleteForm(formType: string): ThunkActionResult<void>;
    resetForm(formType: string): ThunkActionResult<void>;
    renameForm(formType: string, formName: string): ThunkActionResult<void>;
    createForm<T>(
      formType: string,
      config: Partial<RestifyFormConfig<T>>,
      allowRecreate?: boolean,
    ): ThunkActionResult<void>;
    sendQuickForm<T, LinkedModel = T>(
      config: Partial<RestifyFormConfig<T>>,
    ): ThunkActionResult<Promise<FormSubmitResult<LinkedModel>>>;
  } & {
    [key: string]: RestifyFormActions;
  };
  export const constants: {
    NAME: string;
  };
  export function getRestifyFormReducer(): any;
  export function createFormConfig<T>(config: Partial<RestifyFormConfig<T>>): RestifyFormConfig<T>;
  export function getFormActions<T>(formType: string): RestifyFormActions<T>;
  export function checkErrors(errors: any, form: any, validateAll: boolean): boolean;
  export const selectors: {
    getFormsMap(formType: FormTypeSelector, state: any, mapFunction: (key: string, state: any) => any): any;
    getFormConfig(formType: FormTypeSelector): any;

    getIsFormExist: (formType: FormTypeSelector) => GetIsFormExist;
    getEndpoint: (formType: FormTypeSelector) => GetEndpoint;
    getForm: (formType: FormTypeSelector) => GetForm;
    getFormWithNulls: (formType: FormTypeSelector) => GetFormWithNulls;
    getField: (formType: FormTypeSelector) => GetField;
    getSavedField: (formType: FormTypeSelector) => GetSavedField;
    getErrors: (formType: FormTypeSelector) => GetErrors;
    getIsValid: (formType: FormTypeSelector) => GetIsValid;
    getDirtyFields: (formType: FormTypeSelector) => GetDirtyFields;
    getIsDirty: (formType: FormTypeSelector) => GetIsDirty;
    getEditingFields: (formType: FormTypeSelector) => GetEditingFields;
  } & {
    [key: string]: FormSelectors;
  };
}
