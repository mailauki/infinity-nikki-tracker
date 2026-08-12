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
// Fails OPEN on a database error: a broken counter should not take the
// feedback form offline, and the abuse ceiling is bounded by the size caps.
export async function checkRateLimit(
  client: SupabaseClient,
  ip: string
): Promise<{ allowed: boolean }> {
  const ip_hash = hashIp(ip)
  const window_start = currentWindowStart().toISOString()

  const { data, error } = await client
    .from('feedback_rate_limit')
    .select('count')
    .eq('ip_hash', ip_hash)
    .eq('window_start', window_start)
    .maybeSingle()

  if (error) {
    console.error('Rate limit read failed, allowing request:', error)
    return { allowed: true }
  }

  const used = data?.count ?? 0
  if (used >= RATE_LIMIT_PER_HOUR) return { allowed: false }

  const { error: writeError } = await client
    .from('feedback_rate_limit')
    .upsert({ ip_hash, window_start, count: used + 1 }, { onConflict: 'ip_hash,window_start' })

  if (writeError) {
    console.error('Rate limit write failed, allowing request:', writeError)
  }

  return { allowed: true }
}
