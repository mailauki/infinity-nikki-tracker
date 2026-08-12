import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkRateLimit,
  currentWindowStart,
  hashIp,
  RATE_LIMIT_PER_HOUR,
} from '@/lib/feedback/rate-limit'

// Minimal stand-in for SupabaseClient: checkRateLimit only ever calls `.rpc()`.
function mockClient(rpc: (...args: unknown[]) => unknown): SupabaseClient {
  return { rpc } as unknown as SupabaseClient
}

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

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.stubEnv('FEEDBACK_IP_SALT', 'test-salt')
  })

  it('allows the request when the RPC returns a low count', async () => {
    const client = mockClient(() => Promise.resolve({ data: 1, error: null }))
    const result = await checkRateLimit(client, '203.0.113.5')
    expect(result.allowed).toBe(true)
  })

  it('allows the request when the RPC returns exactly the per-hour limit', async () => {
    const client = mockClient(() => Promise.resolve({ data: RATE_LIMIT_PER_HOUR, error: null }))
    const result = await checkRateLimit(client, '203.0.113.5')
    expect(result.allowed).toBe(true)
  })

  it('blocks the request when the RPC returns one past the per-hour limit', async () => {
    const client = mockClient(() => Promise.resolve({ data: RATE_LIMIT_PER_HOUR + 1, error: null }))
    const result = await checkRateLimit(client, '203.0.113.5')
    expect(result.allowed).toBe(false)
  })

  it('fails open and allows the request when the RPC errors', async () => {
    const client = mockClient(() =>
      Promise.resolve({ data: null, error: new Error('connection refused') })
    )
    const result = await checkRateLimit(client, '203.0.113.5')
    expect(result.allowed).toBe(true)
  })
})
