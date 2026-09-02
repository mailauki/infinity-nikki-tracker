import { afterEach, describe, expect, it, vi } from 'vitest'
import { logQueryError } from '@/hooks/data/follows'

// PostgrestError extends Error, so `message` comes from Error.prototype and is
// non-enumerable. Reproduce that shape rather than a plain object literal —
// a plain object would serialize fine and the test would prove nothing.
class PostgrestError extends Error {
  code: string
  hint: string | null
  details: string | null

  constructor(message: string, code: string, hint: string | null = null) {
    super(message)
    this.name = 'PostgrestError'
    this.code = code
    this.hint = hint
    this.details = null
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('logQueryError', () => {
  // The bug this guards: console.error(label, error) printed "{}" because
  // JSON serialization drops the inherited, non-enumerable `message`.
  it('includes the message, which plain serialization drops', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new PostgrestError(
      "Could not find the table 'public.follows' in the schema cache",
      'PGRST205'
    )

    // Guard the premise: the naive approach really does lose the message.
    expect(JSON.stringify(error)).not.toContain('Could not find the table')

    logQueryError('Failed to load following', error)

    const output = spy.mock.calls[0]?.[0] as string
    expect(output).toContain('Failed to load following')
    expect(output).toContain("Could not find the table 'public.follows'")
    expect(output).toContain('PGRST205')
  })

  it('appends the hint when the error carries one', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logQueryError('Failed to load followers', new PostgrestError('boom', 'PGRST200', 'try a hint'))

    expect(spy.mock.calls[0]?.[0]).toContain('try a hint')
  })

  it('degrades gracefully when the error has no message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logQueryError('Failed to load viewer following ids', {})

    expect(spy.mock.calls[0]?.[0]).toContain('unknown error')
  })
})
