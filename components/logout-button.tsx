'use client'

import { useRouter } from 'next/navigation'

import { clearColorThemeCookie } from '@/app/actions/preferences'
import { createClient } from '@/lib/supabase/client'
import { ListItemIcon, MenuItem } from '@mui/material'
import { Logout } from '@mui/icons-material'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await Promise.all([clearColorThemeCookie(), supabase.auth.signOut()])
    router.refresh()
    router.push('/login')
  }

  return (
    <MenuItem onClick={logout}>
      <ListItemIcon>
        <Logout fontSize="small" />
      </ListItemIcon>
      Logout
    </MenuItem>
  )
}
