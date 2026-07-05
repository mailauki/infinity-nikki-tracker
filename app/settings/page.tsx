import { Metadata } from 'next'
import { Suspense } from 'react'
import SettingsTabs from '@/app/settings/settings-tabs'
import { getUserID, getUserRole } from '@/hooks/user'
import { createClient } from '@/lib/supabase/server'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Settings',
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}

async function SettingsContent() {
  const user_id = await getUserID()
  const role = user_id ? await getUserRole() : null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isPremium = false
  if (user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user_id)
      .single()
    isPremium = profile?.is_premium ?? false
  }

  return (
    <PageShell disableVerticalPadding maxWidth="md">
      <SettingsTabs
        isAdmin={role === 'admin'}
        isLoggedIn={!!user_id}
        isPremium={isPremium}
        user={user}
      />
    </PageShell>
  )
}
