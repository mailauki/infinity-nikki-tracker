import { NavLink } from '@/lib/types/props'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import {
  Avatar,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  ToggleButton,
  Tooltip,
  useColorScheme,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NavSection({
  items,
  open = false,
  onClose,
}: {
  items: NavLink[]
  open?: boolean
  onClose?: () => void
}) {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id
      if (!id) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', id).single()
      if (profile?.role === 'admin') setIsAdmin(true)
    })
  }, [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const pathname = usePathname()

  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin)

  return (
    <List>
      {visibleItems.map((item) => (
        <ExpandNavLink key={item.title} items={item.items!} open={open} onClose={onClose}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip placement="right" title={open ? '' : item.title}>
              <ListItemButton
                component="a"
                href={item.url}
                selected={item.url === `/${pathname.split('/')[1]}`}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  justifyContent: 'initial',
                }}
                onClick={onClose}
              >
                {item.image ? (
                  <ListItemAvatar
                    sx={{
                      ml: -1,
                      mr: open ? 0.5 : 0,
                    }}
                  >
                    <Avatar
                      alt={item.title}
                      src={item.image}
                      sx={{ filter: isDarkMode ? 'none' : 'grayscale(100%) brightness(40%)' }}
                    />
                  </ListItemAvatar>
                ) : (
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: 'center',
                      mr: open ? 3.5 : 0,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}
                {open && <ListItemText primary={item.title} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </ExpandNavLink>
      ))}
    </List>
  )
}

function ExpandNavLink({
  children,
  items,
  open,
  onClose,
}: Readonly<{
  children: React.ReactNode
  items: NavLink[]
  open: boolean
  onClose?: () => void
}>) {
  const [expandOpen, setExpandOpen] = useState(false)
  const visibleItems = items?.filter((item) => !item.adminOnly)

  return (
    <>
      {open && visibleItems?.length ? (
        <>
          <Stack direction="row">
            {children}
            <ToggleButton value={expandOpen} onClick={() => setExpandOpen(!expandOpen)}>
              {expandOpen ? <ExpandLess /> : <ExpandMore />}
            </ToggleButton>
          </Stack>
          <Collapse unmountOnExit in={expandOpen} timeout="auto">
            <List disablePadding component="div">
              {visibleItems.map((item) => (
                <ListItem key={item.title} disablePadding sx={{ display: 'block', py: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href={item.url}
                    sx={{
                      minHeight: 48,
                      borderRadius: 2,
                      justifyContent: 'initial',
                    }}
                    onClick={onClose}
                  >
                    <ListItemText inset primary={item.title} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </>
      ) : (
        children
      )}
    </>
  )
}
