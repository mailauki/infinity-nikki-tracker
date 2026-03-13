'use client'

import { usePathname, useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { ListItemIcon, MenuItem } from '@mui/material'
import { Logout } from '@mui/icons-material'

export function LogoutButton() {
  const router = useRouter()
  const pathname = usePathname()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace(pathname)
    router.push('/auth/login')
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
