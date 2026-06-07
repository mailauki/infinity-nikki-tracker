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
import Image from 'next/image'
import { SparkleIcon } from '../rarity-stars'
import ToggleIcon from '../toggle-icon'

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
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const pathname = usePathname()

  const visibleItems = items.filter((item) => !item.adminOnly)

  if (items.length === 1)
    return (
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip placement="right" title={open ? '' : items[0].title}>
            <ListItemButton
              component="a"
              href={items[0].url}
              selected={items[0].url === `/${pathname.split('/')[1]}`}
              sx={{
                minHeight: 55,
                justifyContent: 'initial',
              }}
              onClick={onClose}
            >
              <ListItemIcon>
                <SparkleIcon />
              </ListItemIcon>
              <Image
                alt="Infinity Nikki Logo"
                height={60}
                src="/infinity-nikki-logo.png"
                style={{
                  height: 'auto',
                  display: open ? 'block' : 'none',
                  marginLeft: 16,
                  filter: isDarkMode ? 'none' : 'brightness(40%)',
                }}
                width={90}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    )

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
                    {/* <ToggleIcon item={item} /> */}
                  </ListItemAvatar>
                ) : (
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: 'center',
                      mr: 3.5,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.title}
                  sx={{
                    opacity: open ? 1 : 0,
                    maxWidth: open ? 200 : 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
                  }}
                />
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
