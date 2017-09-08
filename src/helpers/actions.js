import { snakeToCamel } from './namingNotation.js'


export const makeActionsBundle = (moduleName, bundleName, actionsArray) => {
  const actionsMap = actionsArray.map(a => ({ [snakeToCamel(a)]: `${moduleName}/${bundleName}/${a}` }))
  return actionsMap.reduce((acc, el) => ({
    ...acc,
    ...el,
  }), {})
}
