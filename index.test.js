const TaskListOps = require('./index')

describe('task list status', () => {

  const mockSchema = {
    firstTask: {
      path: '/',
      summaryPath: './includes/summaries/firstTask.html',
      title: 'First task',
      pages: {
        'enter-name': {
          fields: {
            'full-name': {
              type: 'nonEmptyString',
              name: 'your full name',
              maxLength: 135
            }
          }
        },
        'enter-date-of-birth': {
          fields: {
            'date-of-birth': {
              type: 'date',
              name: 'your date of birth'
            }
          }
        }
      }
    },
    secondTask: {
      path: '/',
      summaryPath: './includes/summaries/secondTask.html',
      title: 'Second task',
      pages: {
        'do-you-have-a-car': {
          fields: {
            'has-car': {
              type: 'enum',
              name: 'yes if you have a car',
              validValues: ['yes', 'no']
            }
          }
        },
        'enter-car-registration': {
          includeIf: data => data['has-car'] === 'yes',
          fields: {
            'car-registration': {
              type: 'nonEmptyString',
              name: 'your car registration',
              regex: /^([a-z0-9]+)$/i,
              patternText: 'Your car registration must only include letters and numbers',
              maxLength: 10
            }
          }
        },
        'enter-car-colour': {
          includeIf: data => data['has-car'] === 'yes',
          fields: {
            'car-colour': {
              type: 'nonEmptyString',
              name: 'your car colour'
            }
          }
        }
      }
    },
    thirdTask: {
      includeIf: data => TaskListOps.taskStatus(data, mockSchema.secondTask) === TaskListOps.STATUS.COMPLETE,
      path: '/',
      summaryPath: './includes/summaries/thirdTask.html',
      title: 'Third task',
      customTitle: data => data['has-car'] === 'yes' ? 'About your car' : 'About buying cars',
      pages: {
        'what-is-a-good-car-price': {
          fields: {
            'good-car-price': {
              type: 'currency',
              name: 'how much you would pay for a car',
              currencyMin: 1
            }
          }
        }
      }
    },
    impossibleTask: {
      includeIf: data => false,
      summaryPath: '',
      path: '/',
      pages: {}
    }
  }

  test('includedPages includes all pages in a task that require completion', () => {
    const expectedPagesInFirstTask = [
      mockSchema.firstTask.pages['enter-name'],
      mockSchema.firstTask.pages['enter-date-of-birth']
    ]
    expect(TaskListOps.includedPages({}, mockSchema.firstTask)).toEqual(expectedPagesInFirstTask)
  })

  test('includedPages does not include pages that do not require completion', () => {
    const expectedPagesInSecondTask = [
      mockSchema.secondTask.pages['do-you-have-a-car']
    ]
    expect(TaskListOps.includedPages({}, mockSchema.secondTask)).toEqual(expectedPagesInSecondTask)
  })

  test('includedPages includes pages as required by includeIf conditions', () => {
    const expectedPagesInSecondTask = [
      mockSchema.secondTask.pages['do-you-have-a-car'],
      mockSchema.secondTask.pages['enter-car-registration'],
      mockSchema.secondTask.pages['enter-car-colour']
    ]
    expect(TaskListOps.includedPages({'has-car': 'yes'}, mockSchema.secondTask)).toEqual(expectedPagesInSecondTask)
  })

  test('isComplete returns false for incomplete pages in a task', () => {
    const pages = TaskListOps.includedPages({}, mockSchema.firstTask)
    expect(TaskListOps.isComplete({}, pages)).toBe(false)
  })

  test('isComplete returns true when all pages in a task are complete', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const pages = TaskListOps.includedPages(data, mockSchema.firstTask)
    expect(TaskListOps.isComplete(data, pages)).toBe(true)
  })

  test('isInProgress returns true when some pages are complete in a task', () => {
    const data = {'full-name': 'John Doe'}
    const pages = TaskListOps.includedPages(data, mockSchema.firstTask)
    expect(TaskListOps.isInProgress(data, pages)).toBe(true)
  })

  test('taskStatus is "to do" when no pages are complete in a task that can be started', () => {
    const data = {}
    const expectedStatus = TaskListOps.STATUS.TO_DO
    expect(TaskListOps.taskStatus(data, mockSchema.firstTask)).toBe(expectedStatus)
  })

  test('taskStatus is "in progress" when some pages are complete in a task', () => {
    const data = {'full-name': 'John Doe'}
    const expectedStatus = TaskListOps.STATUS.IN_PROGRESS
    expect(TaskListOps.taskStatus(data, mockSchema.firstTask)).toBe(expectedStatus)
  })

  test('taskStatus is "complete" when all pages are complete in a task', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const expectedStatus = TaskListOps.STATUS.COMPLETE
    expect(TaskListOps.taskStatus(data, mockSchema.firstTask)).toBe(expectedStatus)
  })

  test('taskStatus is "cannot start" when condition is not met for a task', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const expectedStatus = TaskListOps.STATUS.CANNOT_START
    expect(TaskListOps.taskStatus(data, mockSchema.thirdTask)).toBe(expectedStatus)
  })

  test('taskStatus is "cannot start" when task is not passed', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const expectedStatus = TaskListOps.STATUS.CANNOT_START
    expect(TaskListOps.taskStatus(data)).toBe(expectedStatus)
  })

  test('taskStatus is "to do" when condition is met for a task', () => {
    const data = {'has-car': 'no'}
    const expectedStatus = TaskListOps.STATUS.TO_DO
    expect(TaskListOps.taskStatus(data, mockSchema.thirdTask)).toBe(expectedStatus)
  })

  test('taskListComplete returns false when all required tasks are not complete', () => {
    const data = {'has-car': 'yes'}
    expect(TaskListOps.taskListComplete(data, mockSchema)).toBe(false)
  })

  test('taskListComplete returns true when all required tasks are complete', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01', 'has-car': 'no', 'good-car-price': '100'}
    expect(TaskListOps.taskListComplete(data, mockSchema)).toBe(true)
  })

  test('taskListStatus returns status objects for each task', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01', 'has-car': 'no', 'good-car-price': '100'}
    const firstTaskStatus = {
      status: TaskListOps.STATUS.COMPLETE,
      link: '/check-your-answers',
      title: mockSchema.firstTask.title
    }
    const secondTaskStatus = {
      status: TaskListOps.STATUS.COMPLETE,
      link: '/check-your-answers',
      title: mockSchema.secondTask.title
    }
    const thirdTaskStatus = {
      status: TaskListOps.STATUS.COMPLETE,
      link: '/check-your-answers',
      title: mockSchema.thirdTask.customTitle(data)
    }
    expect(TaskListOps.returnTaskStatus(data, mockSchema).firstTask).toEqual(firstTaskStatus)
    expect(TaskListOps.returnTaskStatus(data, mockSchema).secondTask).toEqual(secondTaskStatus)
    expect(TaskListOps.returnTaskStatus(data, mockSchema).thirdTask).toEqual(thirdTaskStatus)
  })

  test('taskListStatus returns cya status as cannot start when tasks are incomplete', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    expect(TaskListOps.returnTaskStatus(data, mockSchema).cya.status).toEqual(TaskListOps.STATUS.CANNOT_START)
  })

  test('taskListStatus returns cya status as to do when tasks are all complete', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01', 'has-car': 'no', 'good-car-price': '100'}
    expect(TaskListOps.returnTaskStatus(data, mockSchema).cya.status).toEqual(TaskListOps.STATUS.TO_DO)
  })

  test('nextQuestion returns CYA link when all pages are complete in a task', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const expectedLink = '/check-your-answers'
    expect(TaskListOps.nextQuestion(data, mockSchema.firstTask)).toBe(expectedLink)
  })

  test('taskStart provides route to first page that needs completing in a task', () => {
    const data = {'full-name': 'John Doe'}
    const expectedStartLink = '/enter-date-of-birth'
    expect(TaskListOps.taskStart(data, mockSchema.firstTask)).toBe(expectedStartLink)
  })

  test('taskStart provides route to cya page if a task is complete', () => {
    const data = {'full-name': 'John Doe', 'date-of-birth': '1990-01-01'}
    const expectedStartLink = '/check-your-answers'
    expect(TaskListOps.taskStart(data, mockSchema.firstTask)).toBe(expectedStartLink)
  })

  test('includedSections includes tasks that can be shown on a master cya page', () => {
    const expectedTasks = { ...mockSchema }
    delete expectedTasks.impossibleTask
    expect(TaskListOps.includedSections({'has-car': 'no'}, mockSchema)).toStrictEqual(expectedTasks)
  })

  test('includedSections does not include tasks in excludedKeys', () => {
    const expectedTasks = { firstTask: { ...mockSchema.firstTask } }
    expect(TaskListOps.includedSections({'has-car': 'no'}, mockSchema, ['secondTask', 'thirdTask'])).toStrictEqual(expectedTasks)
  })

  test('getTaskTitle returns custom title if present', () => {
    const expectedTitle = 'About your car'
    expect(TaskListOps.getTaskTitle({'has-car': 'yes'}, mockSchema.thirdTask)).toBe(expectedTitle)
  })

  test('getTaskTitle returns undefined if no title', () => {
    expect(TaskListOps.getTaskTitle({}, mockSchema.impossibleTask)).toBe('undefined')
  })

})
