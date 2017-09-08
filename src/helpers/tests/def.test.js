import * as def from '../def'


describe('def helper', () => {
  it('can check if value is undefined', () => {
    expect(def.isDef(undefined)).toBe(false)
    expect(def.isDef(null)).toBe(true)
    expect(def.isDef(1)).toBe(true)
  })
  it('can check if value is null', () => {
    expect(def.isNotNull(undefined)).toBe(true)
    expect(def.isNotNull(null)).toBe(false)
    expect(def.isNotNull(1)).toBe(true)
  })
  it('can check if value is null or undefined', () => {
    expect(def.isDefAndNotNull(undefined)).toBe(false)
    expect(def.isDefAndNotNull(null)).toBe(false)
    expect(def.isDefAndNotNull(1)).toBe(true)
  })
})
