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
import { useState } from 'react'

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
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'
  const pathname = usePathname()

  return (
    <List>
      {items.map((item) => (
        <ListItem key={item.title} disablePadding sx={{ display: 'block', py: 0.5 }}>
          <ExpandNavLink items={item.items!} open={open} onClose={onClose}>
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
          </ExpandNavLink>
        </ListItem>
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
  return (
    <>
      {open && items ? (
        <>
          <Stack direction="row">
            {children}
            <ToggleButton value={expandOpen} onClick={() => setExpandOpen(!expandOpen)}>
              {expandOpen ? <ExpandLess /> : <ExpandMore />}
            </ToggleButton>
          </Stack>
          <Collapse unmountOnExit in={expandOpen} timeout="auto">
            <List disablePadding component="div">
              {items.map((item) => (
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
