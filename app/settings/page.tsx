import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import SettingsTabs from '@/app/settings/settings-tabs'
import { getUserID, getUserRole } from '@/hooks/user'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <SettingsTabs isAdmin={role === 'admin'} isLoggedIn={!!user_id} user={user} />
    </Stack>
  )
}
