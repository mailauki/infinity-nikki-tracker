import { AppBar, Stack, Toolbar, Typography } from '@mui/material'
import ThemeSwitcher from './theme-switcher'

export default function Footer() {
  return (
    <AppBar
      color="default"
      component="footer"
      position="fixed"
      sx={{ top: 'auto', bottom: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Stack
          alignItems="center"
          direction="row"
          flex={1}
          justifyContent="space-between"
          sx={{ mx: 1, mb: 1 }}
        >
          <Typography color="textDisabled" variant="caption">
            &copy; 2026 mailauki
          </Typography>
          <ThemeSwitcher />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
