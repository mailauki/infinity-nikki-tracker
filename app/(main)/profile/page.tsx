import ProfileForm from '@/components/forms/auth/profile-form'
import CollectionStats from '@/components/collection-stats'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'
import { getEurekaSets } from '@/hooks/data/eureka-sets'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense>
      <PageContainer title="Profile">
        <UserDetails />
      </PageContainer>
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
      {sets && <CollectionStats sets={sets} />}
      <ProfileForm isAdmin={role === 'admin'} user={user} />
    </>
  )
}
