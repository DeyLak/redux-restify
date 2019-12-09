import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'


export type ThunkActionResult<T> = ThunkAction<T, any, null, Action<string>>
