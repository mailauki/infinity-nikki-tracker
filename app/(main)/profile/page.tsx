import ProfileForm from '@/components/profile-form'
import { createClient } from '@/lib/supabase/server'
import { Container, Typography } from '@mui/material'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default function ProfilePage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <UserDetails />
      </Container>
    </Suspense>
  )
}

async function UserDetails() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <>
      <Typography variant="h3" component="h1">
        Profile
      </Typography>
      <ProfileForm user={user} />
    </>
  )
}
