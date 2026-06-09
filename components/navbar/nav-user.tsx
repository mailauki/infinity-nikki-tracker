'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Tooltip,
} from '@mui/material'
import React from 'react'
import { navLinksData } from '@/lib/nav-links'
import { List } from '@mui/icons-material'
import { LogoutButton } from '../logout-button'
import AvatarPreview from '../../app/settings/avatar-preview'

export function NavUser() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    setAnchorElUser(null)
  }, [pathname])
  // undefined = not yet loaded, null = no user
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function loadProfile(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, role')
        .eq('id', userId)
        .single()

      if (mounted && profile) {
        setAvatarUrl(profile.avatar_url)
        setIsAdmin(profile.role === 'admin')
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const id = data.user?.id ?? null
      setUserId(id)
      if (id) loadProfile(id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || event === 'INITIAL_SESSION') return
      const id = session?.user?.id ?? null
      setUserId(id)
      if (id) {
        loadProfile(id)
      } else {
        setAvatarUrl(null)
        setIsAdmin(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (userId === undefined) {
    return (
      <Box sx={{ position: 'absolute', top: 24, right: 18 }}>
        <Skeleton height={40} variant="circular" width={40} />
      </Box>
    )
  }

  if (!userId) {
    return (
      <Box sx={{ position: 'absolute', top: 16, right: 12 }}>
        <Button color="inherit" href="/login">
          Login
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flexGrow: 0,
        position: 'absolute',
        top: 24,
        right: 18,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Tooltip placement="bottom-end" title="Open menu">
        <IconButton
          aria-controls={Boolean(anchorElUser) ? 'fixed-menu' : undefined}
          aria-expanded={Boolean(anchorElUser) ? 'true' : undefined}
          aria-haspopup="true"
          id="menu-button"
          sx={{ p: 0 }}
          onClick={(e) => setAnchorElUser(e.currentTarget)}
        >
          <AvatarPreview url={avatarUrl} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock={true}
        id="fixed-menu"
        open={Boolean(anchorElUser)}
        sx={{ mt: '45px' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setAnchorElUser(null)}
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
