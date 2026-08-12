import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RATE_LIMIT_PER_HOUR = 5

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
