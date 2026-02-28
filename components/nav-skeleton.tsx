import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'

const DRAWER_WIDTH = 57

export default function NavSkeleton() {
  return (
    <Stack className="h-screen overflow-hidden">
      <Stack direction="row">
        {/* AppBar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 6, flexShrink: 0 }} />
            <Skeleton variant="text" width={180} height={28} />
          </Toolbar>
        </AppBar>

        {/* Drawer (closed state) */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              overflowX: 'hidden',
            },
          }}
        >
          <Toolbar />
          <Divider />
          <List>
            {[0].map((i) => (
              <ListItem key={i} disablePadding sx={{ display: 'block' }}>
                <ListItemButton sx={{ justifyContent: 'center', px: 2.5, py: 1.5 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[0, 1].map((i) => (
              <ListItem key={i} disablePadding sx={{ display: 'block' }}>
                <ListItemButton sx={{ justifyContent: 'center', px: 2.5, py: 1.5 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main content area */}
        <Box component="main" className="h-screen w-full overflow-hidden">
          <Toolbar />
          {/* NavTabs skeleton */}
          <Toolbar disableGutters>
            <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', px: 1 }}>
              <Stack direction="row" gap={2} sx={{ py: 1 }}>
                {[120, 80, 100].map((w, i) => (
                  <Skeleton key={i} variant="text" width={w} height={32} />
                ))}
              </Stack>
            </Box>
          </Toolbar>
          <Toolbar />
        </Box>
      </Stack>
    </Stack>
  )
}
