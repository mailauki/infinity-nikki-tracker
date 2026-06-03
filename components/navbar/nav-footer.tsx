'use client'
import { AppBar, Stack, Toolbar, Typography } from '@mui/material'
import CoffeeButton from './coffee-button'
import ThemeSwitcher from './theme-switcher'

export default function Footer() {
  return (
    <AppBar
      color="inherit"
      component="footer"
      position="relative"
      sx={{
        borderColor: 'transparent',
        backgroundColor: 'surface.containerLowest',
        py: 2,
      }}
      variant="outlined"
    >
      <Toolbar>
        <Stack
          direction="row"
          spacing={3}
          sx={{ flex: 1, mx: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Typography color="textDisabled" variant="caption">
            &copy; 2026 mailauki
          </Typography>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
            <CoffeeButton />
            <ThemeSwitcher />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
