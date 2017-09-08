import { makeActionsBundle } from '../actions'


describe('actions helper', () => {
  it('makes actions names according to ducks and creates camelCase map object', () => {
    const moduleName = 'testModule'
    const bundleName = 'testBundle'
    const actions = [
      'TEST',
      'TEST_2',
      'TEST_TEST',
      'TEST_TEST_TEST',
    ]
    const bundle = makeActionsBundle(moduleName, bundleName, actions)
    expect(bundle).toEqual({
      test: `${moduleName}/${bundleName}/TEST`,
      test2: `${moduleName}/${bundleName}/TEST_2`,
      testTest: `${moduleName}/${bundleName}/TEST_TEST`,
      testTestTest: `${moduleName}/${bundleName}/TEST_TEST_TEST`,
    })
  })
})
