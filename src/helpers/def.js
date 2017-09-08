export const isDef = val => val !== undefined

export const isNotNull = val => val !== null

export const isDefAndNotNull = val => val !== undefined && val !== null

export const isPureObject = val => {
  if (typeof val !== 'object' || val === null) return false
  if (val.constructor === Object || val.constructor === Array) return true
  return false
}
