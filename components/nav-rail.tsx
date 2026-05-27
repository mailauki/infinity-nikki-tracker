import { navLinksData } from '@/lib/nav-links'
import { MenuOpen } from '@mui/icons-material'
import {
  Avatar,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
} from '@mui/material'

export default function NavRail() {
  return (
    <>
      <Paper sx={{ minWidth: 240, my: 2, borderRadius: 4, overflow: 'clip' }}>
        <Toolbar disableGutters sx={{ px: 2 }}>
          <IconButton>
            <MenuOpen />
          </IconButton>
        </Toolbar>
        <Stack
          justifyContent="space-between"
          sx={{ flex: 1, width: '100%', minHeight: 'calc(100vh - 32px - 64px)' }}
        >
          <List>
            {navLinksData.navMain.map((link) => (
              <ListItem key={link.url} disablePadding>
                <ListItemButton component="a" href={link.url}>
                  <ListItemAvatar>
                    <Avatar alt={link.title} src={link.image} />
                  </ListItemAvatar>
                  <ListItemText primary={link.title} />
                </ListItemButton>
              </ListItem>
            ))}
            <Divider />
            {navLinksData.navSecondary.map((link) => (
              <ListItem key={link.url} disablePadding>
                <ListItemButton component="a" href={link.url}>
                  <ListItemAvatar>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ width: 40, height: 40 }}
                    >
                      {link.icon}
                    </Stack>
                  </ListItemAvatar>
                  <ListItemText primary={link.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <List>
            {navLinksData.navExtra.map((link) => (
              <ListItem key={link.url} disablePadding>
                <ListItemButton component="a" href={link.url}>
                  <ListItemAvatar>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ width: 40, height: 40 }}
                    >
                      {link.icon}
                    </Stack>
                  </ListItemAvatar>
                  <ListItemText primary={link.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      </Paper>
    </>
  )
}
