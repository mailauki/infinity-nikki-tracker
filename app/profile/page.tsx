import CollectionStats from './collection-stats'
import RecentUpdates from './recent-updates'
import ProfileView from './profile-view'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import ProfileLoading from './loading'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getTrials } from '@/hooks/data/trials'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <UserDetails />
      </Stack>
    </Suspense>
  )
}

async function UserDetails() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const role = await getUserRole()
  const user_id = await getUserID()
  const sets = await getEurekaSets()
  const categories = await getEurekaCategories()
  const colors = await getEurekaColors()
  const trials = await getTrials()
  const recentObtained = user_id ? await getRecentObtained(user_id) : []

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <>
      <ProfileView
        avatar_url={profile?.avatar_url ?? null}
        fullname={profile?.full_name ?? null}
        isAdmin={role === 'admin'}
        loadError={false}
        user={user}
        username={profile?.username ?? null}
      />
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
