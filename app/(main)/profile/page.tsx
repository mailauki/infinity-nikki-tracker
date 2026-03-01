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
  // const user_id = await getUserID()
  const { data, error } = await supabase.auth.getClaims()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }
  // if (!user_id) {
  //   redirect('/auth/login')
  // }
  return (
    // <div className="flex w-full flex-col items-start gap-2 py-4">
    //   <AccountForm user={user} />
    // </div>
    <Box>
      <Typography variant="h3" component="h1">
        Profile
      </Typography>
      {/* <AvatarUpload uid={user_id} url={avatar_url!}  /> */}
      {/* <AvatarUpload
								uid={user?.id ?? null}
								url={avatar_url}
								// onUpload={(url) => {
								// 	setAvatarUrl(url)
								// 	updateProfile({ fullname, username, avatar_url: url })
								// }}
							/> */}
      <ProfileForm user={user} />
    </Box>
  )
}
