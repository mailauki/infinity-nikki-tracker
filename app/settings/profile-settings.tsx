'use client'

import { type User } from '@supabase/supabase-js'
import ProfileForm from './profile-form'
import { Container } from '@mui/material'

export default function ProfileSettings({
  user,
  isPremium = false,
}: {
  user: User | null
  isPremium?: boolean
}) {
  return (
    <Container maxWidth="sm" sx={{ mx: 0 }}>
      <ProfileForm isPremium={isPremium} user={user} />
    </Container>
  )
}
