import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RATE_LIMIT_PER_HOUR = 5

// A missing salt means hashIp degrades to sha256(ip) alone, which is
// trivially reversible across the IPv4 space — the feedback_rate_limit table
// would silently become a de-facto visitor IP log.
//
// This can't be a module-load check: Next.js imports route modules (with
// NODE_ENV=production already set) during `next build`'s page-data
// collection, long before any real server boot or request — a throw at
// import time takes down the build itself, not just a misconfigured deploy.
// Instead it's checked lazily, memoized so it only runs once per process:
// the first real call to checkRateLimit (the actual runtime entry point)
// throws in production — failing the request path loudly the moment the
// server actually starts handling traffic, rather than 500ing silently on
// every submission thereafter — and warns once in dev/test.
//
// hashIp itself stays pure/synchronous, reading process.env directly on
// every call rather than closing over this check, so it keeps working with
// tests that use vi.stubEnv to set the salt per-test.
let saltWarned = false
function ensureIpSaltConfigured(): void {
  if (process.env.FEEDBACK_IP_SALT) return

  // Checked on EVERY call, never memoized: a warm Fluid Compute instance
  // serves many requests, so short-circuiting after the first would let every
  // later request silently hash unsalted — exactly the vulnerability this
  // guard exists to prevent.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FEEDBACK_IP_SALT is not set. Refusing to hash IPs: without it, feedback_rate_limit ' +
        'would store unsalted (trivially reversible) IP hashes.'
    )
  }

  // Only the dev/test warning is rate-limited, to avoid flooding logs.
  if (saltWarned) return
  saltWarned = true
  console.warn(
    'FEEDBACK_IP_SALT is not set — hashIp is running unsalted. This is only tolerated ' +
      'outside production; set FEEDBACK_IP_SALT before deploying.'
  )
}

// Salted digest so the table never accumulates a log of raw visitor IPs.
export function hashIp(ip: string): string {
  const salt = process.env.FEEDBACK_IP_SALT ?? ''
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

// Fixed hourly windows keyed by the top of the hour, so the counter is a
// simple upsert rather than a sliding-window scan.
export function currentWindowStart(now: Date = new Date()): Date {
  const start = new Date(now)
  start.setUTCMinutes(0, 0, 0)
  return start
}

// Returns whether this request is allowed and records it if so.
// Increments and reads the count atomically via an RPC so two concurrent
// requests from the same IP in the same window cannot both read a stale
// count and each write the same value, letting the caller exceed the cap.
// Fails OPEN on a database error: a broken counter should not take the
// feedback form offline, and the abuse ceiling is bounded by the size caps.
export async function checkRateLimit(
  client: SupabaseClient,
  ip: string
): Promise<{ allowed: boolean }> {
  ensureIpSaltConfigured()

  const { data, error } = await client.rpc('increment_feedback_rate_limit', {
    p_ip_hash: hashIp(ip),
    p_window_start: currentWindowStart().toISOString(),
  })

  if (error) {
    console.error('Rate limit check failed, allowing request:', error)
    return { allowed: true }
  }

  // The RPC returns the count AFTER incrementing: the 5th request returns 5
  // and must be allowed, the 6th returns 6 and must be blocked.
  return { allowed: (data ?? 0) <= RATE_LIMIT_PER_HOUR }
}
