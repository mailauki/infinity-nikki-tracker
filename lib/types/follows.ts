import { Tables } from './supabase'

export type Follow = Tables<'follows'>

// The profile fields a follow row is displayed with. Deliberately narrower than
// Tables<'profiles'> — the modal needs identity and an avatar, nothing else.
export type FollowProfile = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'display_name' | 'avatar_url'
>

export type FollowCounts = { following: number; followers: number }
