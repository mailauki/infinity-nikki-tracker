import { Metadata } from 'next'
import { Suspense } from 'react'
import SettingsTabs from '@/app/settings/settings-tabs'
import { getUserID, getUserRole } from '@/hooks/user'
import { createClient } from '@/lib/supabase/server'
import { getIsPremium } from '@/hooks/data/user'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/settings'),
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

  const isPremium = user_id ? await getIsPremium(user_id) : false

  return (
    <PageShell maxWidth="md">
      <SettingsTabs
        isAdmin={role === 'admin'}
        isLoggedIn={!!user_id}
        isPremium={isPremium}
        user={user}
      />
    </PageShell>
  )
}
