import ProfileForm from '@/components/forms/auth/profile-form'
import CollectionStats from '@/components/profile/collection-stats'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <UserDetails />
        </Stack>
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

  const role = await getUserRole()
  const user_id = await getUserID()
  const sets = user_id ? await getEurekaSets() : null

  return (
    <>
      <ProfileForm isAdmin={role === 'admin'} user={user} />
      {sets && <CollectionStats sets={sets} />}
    </>
  )
}
