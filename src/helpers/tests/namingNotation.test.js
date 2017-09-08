import * as namingNotation from '../namingNotation'


const camelStrings = [
  'test',
  'testTest',
  'testTestTest',
]

const lowerSnakeStrings = [
  'test',
  'test_test',
  'test_test_test',
]

const upperSnakeStrings = [
  'TEST',
  'TEST_TEST',
  'TEST_TEST_TEST',
]

const allStrings = [
  camelStrings,
  lowerSnakeStrings,
  upperSnakeStrings,
]

const testObject = {
  test: {
    test_test: '',
    test_test_test: [
      {
        test_test: '',
        test: '',
      },
      {
        test_test: '',
        test: '',
      },
    ],
  },
  test_test: {},
}

const checkTestObject = {
  test: {
    testTest: '',
    testTestTest: [
      {
        testTest: '',
        test: '',
      },
      {
        testTest: '',
        test: '',
      },
    ],
  },
  testTest: {},
}

describe('namingNotation helper', () => {
  it('can convert strings between camelCase, UPPER_SNAKE_CASE and lower_snake_case', () => {
    allStrings.forEach((stringArray, allIndex) => {
      stringArray.forEach((string, index) => {
        if (allIndex !== 0) {
          expect(namingNotation.snakeToCamel(string)).toEqual(camelStrings[index])
        }
        if (allIndex !== 1) {
          expect(namingNotation.camelToLowerSnake(string)).toEqual(lowerSnakeStrings[index])
        }
        if (allIndex !== 2) {
          expect(namingNotation.camelToUpperSnake(string)).toEqual(upperSnakeStrings[index])
        }
      })
    })
  })

  it('can convert nested objects with arrays between cases', () => {
    expect(namingNotation.objectToCamel(testObject)).toEqual(checkTestObject)
  })
})
