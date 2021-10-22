const validation = require('@nubz/gds-validation')

const STATUS = {
  TO_DO: 'to-do',
  COMPLETE: 'complete',
  IN_PROGRESS: 'in-progress',
  CANNOT_START: 'cannot-start'
}

const includedSections = (data, schema, excludedKeys = []) => Object.keys(schema)
  .reduce((obj, next) => {
    if ((typeof schema[next].includeIf === 'undefined' || schema[next].includeIf(data)) &&
      schema[next].summaryPath && !excludedKeys.includes(next)) {
      obj[next] = { ...schema[next] }
    }
    return obj
  }, {})

const includedPages = (data, taskObj) => Object.keys(taskObj.pages)
  .reduce((list, next) => {
    const pageObj = taskObj.pages[next]
    pageObj.title = next
    if (typeof pageObj.includeIf === 'undefined' || pageObj.includeIf(data)) {
      list.push(pageObj)
    }
    return list
  }, [])

const isComplete = (data, pages) =>
  pages.every(validation.isValidPageWrapper(data))

const isInProgress = (data, pages) =>
  pages.some(validation.isValidPageWrapper(data))

const cannotStart = (data, task) =>
  typeof task.includeIf === 'function' && !task.includeIf(data)

const cyaCanStart = (data, schema) =>
  Object.keys(schema).every(task => taskStatus(data, schema[task]) === STATUS.COMPLETE ||
    (typeof schema[task].includeIf === 'function' && !schema[task].includeIf(data))
  )

const getTaskTitle = (data, schemaObj) => {
  if (typeof schemaObj.customTitle === 'function') {
    return schemaObj.customTitle(data)
  } else {
    return schemaObj.title || 'undefined'
  }
}

const taskListStatus = (data, schema) => Object.keys(schema).reduce((obj, next) => {
  obj[next] = {
    status: taskStatus(data, schema[next]),
    link: taskStart(data, schema[next]),
    title: getTaskTitle(data, schema[next])
  }
  return obj
}, {
  cya: {
    status: !cyaCanStart(data, schema) ? STATUS.CANNOT_START : STATUS.TO_DO,
    link: 'check-your-answers',
    title: 'Check your answers'
  }
})

const taskStatus = (data, task) => {
  if (!task) {
    return STATUS.CANNOT_START
  }

  if (cannotStart(data, task)) {
    return STATUS.CANNOT_START
  }

  const pages = includedPages(data, task)

  if (isComplete(data, pages)) {
    return STATUS.COMPLETE
  }

  if (isInProgress(data, pages)) {
    return STATUS.IN_PROGRESS
  }

  return STATUS.TO_DO
}

const taskStart = (data, task) => taskStatus(data, task) === STATUS.COMPLETE
  ? task.cyaPath || task.path + 'check-your-answers' : nextQuestion(data, task)

const nextQuestion = (data, task) => {
  const pages = includedPages(data, task)
  const invalidPages = pages.filter(next => !validation.isValidPage(data, next))
  if (!invalidPages.length) {
    return task.path + 'check-your-answers'
  }
  const page = invalidPages[0]
  const path = page.customPath || task.path
  return path + page.title
}

module.exports = {
  STATUS: STATUS,
  isComplete: isComplete,
  includedPages: includedPages,
  isInProgress: isInProgress,
  cyaCanStart: cyaCanStart,
  taskStatus: taskStatus,
  returnTaskStatus: taskListStatus,
  taskStart: taskStart,
  nextQuestion: nextQuestion,
  includedSections: includedSections,
  getTaskTitle: getTaskTitle
}
