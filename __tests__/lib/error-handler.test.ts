import { ErrorHandler, handleApiError, type AppError } from '../../lib/utils/error-handler'

describe('ErrorHandler', () => {
  test('createError sets message, statusCode and optional code', () => {
    const err = ErrorHandler.createError('not found', 404, 'NOT_FOUND')
    expect(err.message).toBe('not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })

  test('handle logs structured error with context', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const e = ErrorHandler.createError('boom', 500, 'INTERNAL')
    e.details = { foo: 'bar' }
    e.stack = 'stacktrace'

    ErrorHandler.handle(e, 'API')

    expect(spy).toHaveBeenCalled()
    const args = spy.mock.calls[0]
    expect(String(args[0])).toContain('[API] Error:')
    expect(args[1]).toMatchObject({
      message: 'boom',
      code: 'INTERNAL',
      statusCode: 500,
      details: { foo: 'bar' },
      stack: 'stacktrace',
    })

    spy.mockRestore()
  })
})

describe('handleApiError', () => {
  test('returns JSON Response with status and code when AppError', async () => {
    const err = ErrorHandler.createError('bad request', 400, 'BAD_REQUEST')
    const res = handleApiError(err)

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toBe('application/json')

    const body = await res.text()
    const parsed = JSON.parse(body)
    expect(parsed).toEqual({ error: 'bad request', code: 'BAD_REQUEST' })
  })

  test('falls back to 500 and message when non-AppError', async () => {
    const res = handleApiError(new Error('oops'))

    expect(res.status).toBe(500)
    const parsed = JSON.parse(await res.text())
    expect(parsed.error).toBe('oops')
    expect(parsed.code).toBeUndefined()
  })

  test('falls back to default message when error lacks message', async () => {
    const err = { statusCode: 503 } as AppError
    const res = handleApiError(err)
    expect(res.status).toBe(503)
    const parsed = JSON.parse(await res.text())
    expect(parsed.error).toBe('Internal Server Error')
  })
})
test('handle uses production branch without throwing', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const prevEnv = process.env.NODE_ENV
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })

  const e = ErrorHandler.createError('prod error', 500, 'E_PROD')
  expect(() => ErrorHandler.handle(e, 'ProdCtx')).not.toThrow()
  expect(spy).toHaveBeenCalled()

  Object.defineProperty(process.env, 'NODE_ENV', { value: prevEnv, writable: true })
  spy.mockRestore()
})
