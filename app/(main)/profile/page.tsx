import ProfileForm from '@/components/forms/auth/profile-form'
import CollectionStats from '@/components/profile/collection-stats'
import RecentUpdates from '@/components/profile/recent-updates'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { getTrials } from '@/hooks/data/trials'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'

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
  const sets = await getEurekaSets()
  const categories = await getCategories()
  const colors = await getColors()
  const trials = await getTrials()
  const recentObtained = user_id ? await getRecentObtained(user_id) : []

  return (
    <>
      <ProfileForm isAdmin={role === 'admin'} user={user} />
      {user_id && (
        <CollectionStats
          categories={categories || []}
          colors={colors || []}
          sets={sets || []}
          trials={trials || []}
        />
      )}
      {user_id && <RecentUpdates items={recentObtained || []} />}
    </>
  )
}
