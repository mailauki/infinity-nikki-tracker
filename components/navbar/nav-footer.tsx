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
        pb: 2,
      }}
      variant="outlined"
    >
      <Toolbar>
        <Stack
          alignItems="center"
          direction="row"
          flex={1}
          justifyContent="center"
          spacing={3}
          sx={{ mx: 1 }}
        >
          <Typography color="textDisabled" variant="caption">
            &copy; 2026 mailauki
          </Typography>
          <Stack alignItems="center" direction="row" gap={0.5}>
            <CoffeeButton />
            <ThemeSwitcher />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
