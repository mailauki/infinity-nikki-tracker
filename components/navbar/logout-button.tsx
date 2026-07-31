'use client'

import { createClient } from '@/lib/supabase/client'
import { ListItemIcon, MenuItem } from '@mui/material'
import { Logout } from '@mui/icons-material'

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
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
