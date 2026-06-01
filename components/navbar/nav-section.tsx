import { NavLink } from '@/lib/types/props'
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useColorScheme,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
          <Tooltip placement="right" title={open ? '' : item.title}>
            <ListItemButton
              component={Link}
              href={item.url}
              selected={item.url === pathname}
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
      ))}
    </List>
  )
}
