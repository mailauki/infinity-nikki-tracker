import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentWindowStart, hashIp } from '@/lib/feedback/rate-limit'

describe('hashIp', () => {
  beforeEach(() => {
    vi.stubEnv('FEEDBACK_IP_SALT', 'test-salt')
  })

  it('is deterministic for the same address', () => {
    expect(hashIp('203.0.113.5')).toBe(hashIp('203.0.113.5'))
  })

  it('differs between addresses', () => {
    expect(hashIp('203.0.113.5')).not.toBe(hashIp('203.0.113.6'))
  })

  it('never returns the raw address', () => {
    expect(hashIp('203.0.113.5')).not.toContain('203.0.113.5')
  })

  it('produces a hex digest', () => {
    expect(hashIp('203.0.113.5')).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('currentWindowStart', () => {
  it('truncates to the top of the hour', () => {
    const result = currentWindowStart(new Date('2026-08-11T14:37:22.500Z'))
    expect(result.toISOString()).toBe('2026-08-11T14:00:00.000Z')
  })

  it('gives the same window for two times in the same hour', () => {
    const a = currentWindowStart(new Date('2026-08-11T14:01:00Z'))
    const b = currentWindowStart(new Date('2026-08-11T14:59:59Z'))
    expect(a.getTime()).toBe(b.getTime())
  })

  it('gives different windows across an hour boundary', () => {
    const a = currentWindowStart(new Date('2026-08-11T14:59:59Z'))
    const b = currentWindowStart(new Date('2026-08-11T15:00:00Z'))
    expect(a.getTime()).not.toBe(b.getTime())
  })
})
