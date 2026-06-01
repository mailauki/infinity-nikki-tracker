'use client'

import { type User } from '@supabase/supabase-js'
import ProfileForm from '@/components/forms/auth/profile-form'

export default function ProfileSettings({ user }: { user: User | null }) {
  return <ProfileForm alwaysEdit user={user} />
}
