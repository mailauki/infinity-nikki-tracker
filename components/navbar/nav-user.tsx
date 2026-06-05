'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
} from '@mui/material'
import React from 'react'
import { navLinksData } from '@/lib/nav-links'
import { AccountCircle, Dashboard, List, ViewList } from '@mui/icons-material'
import { LogoutButton } from '../logout-button'
import AvatarPreview from '../forms/auth/avatar-preview'

function navIcon(url: string) {
  if (url === '/dashboard') return <Dashboard fontSize="small" />
  if (url === '/profile') return <AccountCircle fontSize="small" />
  return <ViewList fontSize="small" />
}

export function NavUser() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null)
  // undefined = not yet loaded, null = no user
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      const id = user?.id ?? null
      setUserId(id)
      if (!id) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, role')
        .eq('id', id)
        .single()

      if (profile) {
        setAvatarUrl(profile.avatar_url)
        setIsAdmin(profile.role === 'admin')
      }
    })
  }, [])

  if (userId === undefined) {
    return <Skeleton height={40} sx={{ flexShrink: 0 }} variant="circular" width={40} />
  }

  if (!userId) {
    return (
      <Button color="inherit" href="/auth/login">
        Login
      </Button>
    )
  }

  return (
    <Box
      sx={{
        flexGrow: 0,
        position: 'fixed',
        top: 24,
        right: 18,
      }}
    >
      <Tooltip placement="bottom-end" title="Open menu">
        <IconButton
          sx={{ p: 0 }}
          onClick={(e) => setAnchorElUser(e.currentTarget)}
          id="menu-button"
          aria-controls={Boolean(anchorElUser) ? 'fixed-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorElUser) ? 'true' : undefined}
        >
          <AvatarPreview url={avatarUrl} />
        </IconButton>
      </Tooltip>
      <Menu
        keepMounted
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        id="fixed-menu"
        open={Boolean(anchorElUser)}
        sx={{ mt: '45px' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setAnchorElUser(null)}
        disableScrollLock={true}
      >
        {navLinksData.navSecondary
          .filter((link) => !link.adminOnly || isAdmin)
          .map((link) => (
            <MenuItem
              key={link.title}
              component={Link}
              href={link.url}
              onClick={() => setAnchorElUser(null)}
            >
              <ListItemIcon>{link.icon || <List />}</ListItemIcon>
              {link.title}
            </MenuItem>
          ))}
        <Divider />
        <LogoutButton />
      </Menu>
    </Box>
  )
}
