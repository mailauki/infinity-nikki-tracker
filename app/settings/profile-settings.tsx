'use client'

import { type User } from '@supabase/supabase-js'
import ProfileForm from '@/components/forms/auth/profile-form'
import { Container } from '@mui/material'

export default function ProfileSettings({ user }: { user: User | null }) {
  return (
    <Container maxWidth="sm" sx={{ mx: 0 }}>
      <ProfileForm user={user} />
    </Container>
  )
}
