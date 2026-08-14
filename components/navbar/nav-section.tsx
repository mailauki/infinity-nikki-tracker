import { NavLink } from '@/lib/types/props'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import {
  Avatar,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { SparkleIcon } from '../rarity-stars'
import { useIsDarkMode } from '@/hooks/use-is-dark-mode'

export default function NavSection({
  items,
  open = false,
  onClose,
}: {
  items: NavLink[]
  open?: boolean
  onClose?: () => void
}) {
  const isDarkMode = useIsDarkMode()
  const pathname = usePathname()

  const visibleItems = items.filter((item) => !item.adminOnly)

  if (items.length === 1)
    return (
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip placement="right" title={open ? '' : items[0].title}>
            <ListItemButton
              aria-current={items[0].url === `/${pathname.split('/')[1]}` ? 'page' : undefined}
              component={Link}
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
          {/* component="div": ExpandNavLink wraps this in the <li>, so this must
              not be one too — nested <li> is invalid inside a <ul>. */}
          <ListItem disablePadding component="div" sx={{ display: 'block' }}>
            <Tooltip placement="right" title={open ? '' : item.title}>
              <ListItemButton
                aria-current={item.url === `/${pathname.split('/')[1]}` ? 'page' : undefined}
                component={Link}
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
                    {/* <ToggleIcon title={item.title} image={item.image} /> */}
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
          {/* component="li": this renders as a direct child of NavSection's
              <List>, and a bare <div> inside a <ul> breaks list semantics. */}
          <Stack component="li" direction="row" sx={{ alignItems: 'center' }}>
            {children}
            <IconButton
              aria-expanded={expandOpen}
              aria-label={expandOpen ? 'Collapse section' : 'Expand section'}
              onClick={() => setExpandOpen(!expandOpen)}
            >
              {expandOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
          {/* component="li" for the same reason as the Stack above — this is
              also a direct child of NavSection's <List>. */}
          <Collapse unmountOnExit component="li" in={expandOpen} timeout="auto">
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
        // children is a component="div" ListItem, so it needs its own <li>
        // wrapper here to stay a valid child of NavSection's <List>.
        <li>{children}</li>
      )}
    </>
  )
}
