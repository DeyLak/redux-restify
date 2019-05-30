import { ActionCreatorsMapObject } from 'redux'

import { RestifyFormConfig } from './formConfig'

import { RestifyEndpointInfo } from '../api'


export { RestifyFormConfig } from './formConfig'

export * from './validation'

export type FormPath = string | number | (string | number)[]

export interface RestifyFormActions extends ActionCreatorsMapObject {
  deleteForm(): any;
  resetForm(): any;
  renameForm(formName: string): any;
  changeField(name: FormPath, newValue: any): any;
  changeSomeFields(fieldsObject: any, forceUndefines?: boolean): any;
  applyServerData(data: any): any;
  resetField(name: FormPath): any;
  insertToArray(arrayName: FormPath, value?: any, insertingIndex?: number): any;
  insertToArrayAndEdit(arrayName: FormPath, value?: any, index?: number): any;
  manageSavedFieldArrayDeletion(arrayName: FormPath, index: number): any;
  manageSavedFieldArrayInsertion(arrayName: FormPath, index: number, insertedField: any): any;
  removeFromArray(arrayName: FormPath, index?: number, count?: number): any;
  replaceInArray(arrayName: FormPath, value: any, index: number): any;
  moveInArray(arrayName: FormPath, movingIndex: number, insertingIndex: number): any;
  moveInArrayUp(arrayName: FormPath, movingIndex: number): any;
  moveInArrayDown(arrayName: FormPath, movingIndex: number): any;
  changeInArray(arrayName: FormPath, name: string, value: any, index: number): any;
  setErrors(value: any): any;
  resetErrors(): any;
  setFieldError(name: FormPath, value: any): any;
  resetFieldError(name: FormPath): any;
  resetArrayErrors(arrayName: FormPath, index: number): any;
  setArrayFieldErrors(arrayName: FormPath, name: string, value: any, index: number): any;
  resetArrayFieldErrors(arrayName: FormPath, name: string, index: number): any;
  rememberFieldState(name: FormPath, value: any): any;
  enableFieldEditMode(name: FormPath): any;
  saveEditingField(name: FormPath): any;
  validate(): any;
  cancelFieldEdit(name: FormPath): any;
  submit(): any;
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

export interface FormSelectors {
  getIsFormExist: GetIsFormExist,
  getEndpoint: GetEndpoint,
  getForm: GetForm,
  getFormWithNulls: GetFormWithNulls,
  getField: GetField,
  getSavedField: GetSavedField,
  getErrors: GetErrors,
  getIsValid: GetIsValid,
  getEditingFields: GetEditingFields,
}

export namespace forms {
  export const actions: {
    deleteForm(formType: string): any;
    resetForm(formType: string): any;
    renameForm(formType: string, formName: string): any;
    createForm<T>(formType: string, config: Partial<RestifyFormConfig<T>>, allowRecreate?: boolean): any;
    sendQuickForm<T>(config: Partial<RestifyFormConfig<T>>): any;
  } & {
    [key: string]: RestifyFormActions;
  };
  export const constants: {
    NAME: string;
  };
  export function getRestifyFormReducer(): any;
  export function createFormConfig<T>(config: Partial<RestifyFormConfig<T>>): RestifyFormConfig<T>;
  export function getFormActions(formType: string): RestifyFormActions;
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
    getEditingFields: (formType: FormTypeSelector) => GetEditingFields;
  } & {
    [key: string]: FormSelectors;
  };
}
