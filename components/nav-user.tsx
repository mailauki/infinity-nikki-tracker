'use client'

import { JwtPayload } from '@supabase/supabase-js'
import Link from 'next/link'

import { LogoutButton } from './logout-button'
import AvatarPreview from './avatar-preview'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material'
import React from 'react'
import { Person } from '@mui/icons-material'

export function NavUser({ user }: { user: JwtPayload }) {
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
    // <AvatarPreview url={avatar_url} />
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
        {/* {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                </MenuItem>
              ))} */}
        <MenuItem onClick={handleCloseUserMenu} component={Link} href="/profile">
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        {/* <MenuItem onClick={handleCloseUserMenu} component={Link} href="/settings">
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem> */}
        <LogoutButton />
      </Menu>
    </Box>
    // <SidebarMenu>
    //   <SidebarMenuItem>
    //     <DropdownMenu>
    //       <DropdownMenuTrigger asChild>
    //         <SidebarMenuButton
    //           size="lg"
    //           className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
    //         >
    //           <AvatarPreview url={avatar_url} />
    //           <div className="grid flex-1 text-left text-sm leading-tight">
    //             <span className="truncate text-xs">{username || user.email}</span>
    //           </div>
    //           <ChevronsUpDown className="ml-auto size-4" />
    //         </SidebarMenuButton>
    //       </DropdownMenuTrigger>
    //       <DropdownMenuContent
    //         className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
    //         side={isMobile ? 'bottom' : 'right'}
    //         align="end"
    //         sideOffset={4}
    //       >
    //         <DropdownMenuLabel className="p-0 font-normal">
    //           <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
    //             <AvatarPreview url={avatar_url} />
    //             <div className="grid flex-1 text-left text-sm leading-tight">
    //               <span className="truncate pt-0.5 font-medium">{fullname}</span>
    //               <span className="truncate text-xs">{username || user.email}</span>
    //             </div>
    //           </div>
    //         </DropdownMenuLabel>
    //         <DropdownMenuSeparator />
    //         <DropdownMenuGroup>
    //           <DropdownMenuItem asChild>
    //             <Link href="/account">
    //               <BadgeCheck />
    //               Account
    //             </Link>
    //           </DropdownMenuItem>
    //         </DropdownMenuGroup>
    //         <DropdownMenuSeparator />
    //         <LogoutButton />
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   </SidebarMenuItem>
    // </SidebarMenu>
  )
}
