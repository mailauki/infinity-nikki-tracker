import ProfileForm from '@/components/forms/auth/profile-form'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense>
      <PageContainer title='Profile'>
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

  return (
    <ProfileForm user={user} isAdmin={role === 'admin'} />
  )
}
