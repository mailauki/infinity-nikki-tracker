'use client'

import { JwtPayload } from '@supabase/supabase-js'
import Link from 'next/link'

import { LogoutButton } from './logout-button'
import AvatarPreview from './avatar-preview'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material'
import React from 'react'
import { navLinksData } from '@/lib/nav-links'
import { AccountCircle, Dashboard } from '@mui/icons-material'

export function NavUser({ user, isAdmin = false }: { user: JwtPayload; isAdmin?: boolean }) {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null)

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const supabase = createClient()
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getAvatar = useCallback(async () => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`avatar_url`)
        .eq('id', user!.user_metadata!.sub)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
      console.log(error)
    }
  }, [user, supabase])

  useEffect(() => {
    getAvatar()
  }, [user, getAvatar])

  return (
    <Box sx={{ flexGrow: 0 }}>
      <Tooltip title="Open settings">
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
          <AvatarPreview url={avatar_url} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {navLinksData.navSecondary.filter((link) => !link.adminOnly || isAdmin).map((link) => (
          <MenuItem key={link.title} onClick={handleCloseUserMenu} component={Link} href={link.url}>
            <ListItemIcon>
              {/* {link.icon} */}
              {link.url === '/dashboard' ? (
                <Dashboard fontSize="small" />
              ) : (
                <AccountCircle fontSize="small" />
              )}
            </ListItemIcon>
            {link.title}
          </MenuItem>
        ))}
        <Divider />
        <LogoutButton />
      </Menu>
    </Box>
  )
}
