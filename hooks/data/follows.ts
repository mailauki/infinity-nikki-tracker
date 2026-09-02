import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { FollowCounts, FollowProfile } from '@/lib/types/follows'

// React cache(), not `use cache`: every function here calls cookies() via
// createClient(), which `use cache` forbids. cache() is also reads-only — never
// wrap the write path in it.

// The embedded profile columns each query selects. Kept in one place so the two
// directions cannot drift apart.
const PROFILE_FIELDS = 'id, username, display_name, avatar_url'

// Log a Supabase error's fields explicitly rather than handing the object to
// console.error. PostgrestError extends Error, so `message` lives on
// Error.prototype and is non-enumerable — console.error and JSON.stringify
// both drop it, which is how a real failure prints as a useless `{}`. `code`
// is the field worth reading first (e.g. PGRST205 = table missing from the
// schema cache, usually an unapplied migration; PGRST200 = an embed hint that
// does not resolve).
export function logQueryError(
  label: string,
  // Matches PostgrestError's own shape: hint and details are `string | null`,
  // not optional-undefined, so a narrower signature would reject the real type.
  error: { message?: string; code?: string | null; hint?: string | null }
) {
  console.error(
    `${label}: ${error.message ?? 'unknown error'}` +
      (error.code ? ` [${error.code}]` : '') +
      (error.hint ? ` — ${error.hint}` : '')
  )
}

// Profiles this user follows. The join walks follows.following_id -> profiles.
export const getFollowing = cache(async (user_id: string): Promise<FollowProfile[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`profile:profiles!follows_following_id_fkey (${PROFILE_FIELDS})`)
    .eq('follower_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    logQueryError('Failed to load following', error)
    return []
  }

  // A row whose profile failed to resolve is dropped rather than rendered blank.
  return (data ?? []).flatMap((row) => (row.profile ? [row.profile as FollowProfile] : []))
})

// Profiles following this user — the reverse direction, covered by
// follows_following_id_idx.
export const getFollowers = cache(async (user_id: string): Promise<FollowProfile[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`profile:profiles!follows_follower_id_fkey (${PROFILE_FIELDS})`)
    .eq('following_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    logQueryError('Failed to load followers', error)
    return []
  }

  return (data ?? []).flatMap((row) => (row.profile ? [row.profile as FollowProfile] : []))
})

// head: true with an exact count fetches the numbers without transferring rows.
export const getFollowCounts = cache(async (user_id: string): Promise<FollowCounts> => {
  const supabase = await createClient()

  const [following, followers] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user_id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user_id),
  ])

  // A failed count degrades to 0 rather than taking down the profile page.
  return { following: following.count ?? 0, followers: followers.count ?? 0 }
})

// The card's Follow button initial state.
export const getIsFollowing = cache(
  async (viewerId: string | null, targetId: string): Promise<boolean> => {
    // getUserID() returns null for signed-out visitors — guard before querying.
    if (!viewerId) return false

    const supabase = await createClient()

    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', viewerId)
      .eq('following_id', targetId)

    return (count ?? 0) > 0
  }
)

// Every id the viewer follows, for the modal's row buttons.
//
// Row buttons reflect the VIEWER's relationship to each row, not the profile
// owner's — so viewing someone else's Following list, a row you also follow
// reads "Following". Fetching the whole set once avoids an N+1 of per-row
// getIsFollowing calls.
export const getViewerFollowingIds = cache(
  async (viewerId: string | null): Promise<Set<string>> => {
    if (!viewerId) return new Set()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewerId)

    if (error) {
      logQueryError('Failed to load viewer following ids', error)
      return new Set()
    }

    return new Set((data ?? []).map((row) => row.following_id))
  }
)
