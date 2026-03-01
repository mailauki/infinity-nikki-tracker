import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

import { NavUser } from './nav-user'
import { Button } from '@mui/material'

export async function AuthButton() {
  const supabase = await createClient()

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims

  return user ? (
    <NavUser user={user} />
  ) : (
    <div className="flex gap-2">
      <Button component={Link} variant="outlined" href="/auth/login">
        Sign in
      </Button>
      <Button component={Link} variant="contained" href="/auth/sign-up">
        Sign up
      </Button>
    </div>
  )
}
