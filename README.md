![example workflow](https://github.com/nubz/gds-task-list-ops/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/nubz/gds-task-list-ops/badge.svg?branch=main)](https://coveralls.io/github/nubz/gds-task-list-ops?branch=main)
# GDS task list ops

Making a GDS task list work in a prototype. Report the latest status for each task and provide a link that represents 
the next thing required of a task.

Uses `@nubz/gds-validation` to compute the status of each task.

The package requires you to create a model or schema of your task list in the following format:

```typescript
// using TypeScript interfaces as documentation

interface Schema {
  [key: String]: TaskModel
}

interface TaskModel {
  title: String
  customTitle?: (data: Payload) => String // if the task title is dependendent on payload content
  path: String
  summaryPath: String
  pages: PageMap
}

interface PageMap {
  [key: String]: PageModel
}

interface PageModel {
  fields: FieldsMap
  includeIf?: (data: Payload) => Boolean
}

interface FieldsMap {
  [key: string]: FieldObject
}

interface FieldObject {
  type: 'date' | 'currency' | 'enum' | 'optionalString' | 'nonEmptyString' | 'number' | 'file' | 'array'
  name: String
  validValues?: Array<String> // for use if type === 'enum' or `array`, value of enum will be compared to values listed here
  matches?: Array<String> // value of input (can be any string type) must be in this list
  matchingExclusions?: Array<String> // value of input (can be any string type) must not be in this list
  noMatchText?: String // for use in error message to describe what the input is matched against - defaults to `our records` if missing
  includeIf?: (data: Payload) => Boolean
  regex?: RegExp
  exactLength?: Number
  minLength?: Number
  maxLength?: Number
  inputType?: 'characters' | 'digits' | 'numbers' | 'letters and numbers' | 'letters' // any description of permitted keys
  numberMin?: Number
  numberMax?: Number
  currencyMin?: Number
  currencyMax?: Number
  getMaxCurrencyFromField?: (data: Payload) => Number
  afterFixedDate?: Date // iso format string e.g. 2021-04-01
  beforeFixedDate?: Date
  afterDateField?: (data: Payload) => Date // define function to grab value of field e.g. data => data.afterField
  beforeDateField?: (data: Payload) => Date
  afterField?: String // description of the date being compared to e.g. 'Date of birth'
  beforeField?: String // description of the date being compared to e.g. 'Date of death'
  beforeToday?: Boolean
  patternText?: String // description of regex for error messages - defaults to `${fieldDescription} is not valid`
}

interface Payload {
  [key: String]: String | Number | Array<String> | Date
}
```
