export function getFormActions(formType: any): any;
export default forms;
declare namespace forms {
    export function sendQuickForm(config: any): (dispatch: any) => any;
    export function deleteForm(formType: any): {
        type: any;
        formType: any;
    };
    export function resetForm(formType: any): {
        type: any;
        formType: any;
    };
    export function renameForm(formType: any, formName: any): {
        type: any;
        formType: any;
        formName: any;
    };
    export function createForm(formType: any, config: any, allowRecreate?: boolean): (dispatch: any, getState: any) => any;
    export function changeField(formType: any): (name: any, newValue: any) => (dispatch: any, getState: any) => void;
    export function changeSomeFields(formType: any): (fieldsObject?: {}, forceUndefines?: boolean) => (dispatch: any, getState: any) => void;
    export function applyServerData(formType: any): (data: any) => (dispatch: any, getState: any) => any;
    export function resetField(formType: any): (name: any) => {
        type: any;
        name: any;
        formType: any;
    };
    export function insertToArray(formType: any): (arrayName: any, value: any, insertingIndex: any) => (dispatch: any, getState: any) => any;
    export function insertToArrayAndEdit(formType: any): (arrayName: any, value: any, index: any) => (dispatch: any) => void;
    export function manageSavedFieldArrayDeletion(formType: any): (arrayName: any, index: any) => (dispatch: any, getState: any) => void;
    export function manageSavedFieldArrayInsertion(formType: any): (arrayName: any, index: any, insertedField: any) => (dispatch: any, getState: any) => void;
    export function removeFromArray(formType: any): (arrayName: any, index?: number, count?: number) => (dispatch: any, getState: any) => void;
    export function replaceInArray(formType: any): (arrayName: any, value: any, index: any) => (dispatch: any, getState: any) => void;
    export function moveInArray(formType: any): (arrayName: any, movingIndex: any, insertingIndex: any) => (dispatch: any, getState: any) => void;
    export function moveInArrayUp(formType: any): (arrayName: any, movingIndex: any) => (dispatch: any) => void;
    export function moveInArrayDown(formType: any): (arrayName: any, movingIndex: any) => (dispatch: any) => void;
    export function changeInArray(formType: any): (arrayName: any, name: any, value: any, index: any) => (dispatch: any, getState: any) => void;
    export function setDirtyState(formType: any): (value: any) => {
        type: any;
        value: any;
        formType: any;
    };
    export function resetDirtyState(formType: any): () => {
        type: any;
        value: {};
        formType: any;
    };
    export function setFieldDirtyState(formType: any): (name: any, value: any) => (dispatch: any, getState: any) => any;
    export function resetFieldDirtyState(formType: any): (name: any) => (dispatch: any) => any;
    export function setErrors(formType: any): (value: any) => {
        type: any;
        value: any;
        formType: any;
    };
    export function resetErrors(formType: any): () => {
        type: any;
        value: {};
        formType: any;
    };
    export function setFieldError(formType: any): (name: any, value: any) => (dispatch: any, getState: any) => any;
    export function resetFieldError(formType: any): (name: any) => (dispatch: any, getState: any) => any;
    export function resetArrayErrors(formType: any): (arrayName: any, index: any) => (dispatch: any, getState: any) => any;
    export function setArrayFieldErrors(formType: any): (arrayName: any, name: any, value: any, index: any) => (dispatch: any, getState: any) => any;
    export function resetArrayFieldErrors(formType: any): (arrayName: any, name: any, index: any) => (dispatch: any) => any;
    export function rememberFieldState(formType: any): (name: any, value: any) => {
        type: any;
        value: any;
        name: any;
        formType: any;
    };
    export function enableFieldEditMode(formType: any): (name: any) => (dispatch: any, getState: any) => any;
    export function saveEditingField(formType: any): (name: any) => {
        type: any;
        name: any;
        formType: any;
    };
    export function validate(formType: any): () => (dispatch: any, getState: any) => any;
    export function cancelFieldEdit(formType: any): (name: any) => (dispatch: any, getState: any) => void;
    export function submit(formType: any): () => (dispatch: any, getState: any) => Promise<any>;
}
