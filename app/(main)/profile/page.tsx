import ProfileForm from '@/components/profile-form'
import { createClient } from '@/lib/supabase/server'
import { Box, Typography } from '@mui/material'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default function ProfilePage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <Suspense>
        <UserDetails />
      </Suspense>
    </div>
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
    <Box>
      <Typography variant="h3" component="h1">
        Profile
      </Typography>
      <ProfileForm user={user} />
    </Box>
  )
}
