import { navLinksData } from '@/lib/nav-links'
import { NavLink } from '@/lib/types/props'
import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  useColorScheme,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// export default function NavTabs({
// 	open = false,
// 	onClose,
// }: {
// 	open?: boolean
// 	onClose?: () => void
// }) {

// 	return (
// 	<Stack component="nav" sx={{ flex: 1, mx: 1.5 }}>

// 			<NavSection items={navLinksData.navMain} />

// 			<Divider sx={{ mx: 2, my: 0.5 }} />

// 			<NavSection items={navLinksData.navSecondary} />

//     <Stack sx={{ flex: 1 }}>
// 			<Stack sx={{ flex: 1 }} />
// 			<NavSection items={navLinksData.navExtra} />
//       <Toolbar sx={{ mb: 2 }} />
// 			</Stack>
// 		</Stack>
// 	)
// }

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
                px: 2.5,
                borderRadius: 2,
                justifyContent: 'initial',
              }}
              onClick={onClose}
            >
              {item.image ? (
                <ListItemAvatar
                  sx={{
                    mr: 0.5,
                    ml: -0.5,
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
                    mr: 3.5,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText primary={item.title} />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  )
}
