![example workflow](https://github.com/nubz/gds-task-list-ops/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/nubz/gds-task-list-ops/badge.svg?branch=main)](https://coveralls.io/github/nubz/gds-task-list-ops?branch=main)
# GDS task list ops

Making a GDS task list work in a GOVUK prototype. Report the latest status for each task and provide a link that 
represents the next thing required of a task.

Task lists need data modelling, we need to describe the task list in a schema. 

A schema is essentially an object containing tasks, tasks contain page models and page models contain fields. 
This package provides tools to compare the session data with the schema and return a status object defining the status of each 
task and a link URL for the first page that is invalid within that task, this link URL should be used in the task list template 
as the link to enter that task. If the task is deemed complete then the link should go into the `Check Your Answers` page for 
that task where users can review their answers and change any if required.

### Examples

Examples of simple and complex use cases can be seen on [https://prototype-strategies.herokuapp.com/task-lists/](https://prototype-strategies.herokuapp.com/task-lists/)

### Schema description

The PageModel is as required by the validation package. There is a hard dependency on the [@nubz/gds-validation](https://www.npmjs.com/package/@nubz/gds-validation) package as this is
what is used to tell us whether pages are valid. It is included in this package as a peer dependency.

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

```
