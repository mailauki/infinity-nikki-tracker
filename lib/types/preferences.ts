import { Tables } from './supabase'

// Every preference column. Omit rather than Pick so a new `user_preferences`
// column is typed here automatically — one fewer lockstep update.
export type UserPreferences = Omit<
  Tables<'user_preferences'>,
  'user_id' | 'created_at' | 'updated_at'
>

export type ColorTheme = 'default' | 'moonlight' | 'blossom' | 'forest'

export type AdminPreferences = Pick<Tables<'admin_preferences'>, 'admin_view'>
