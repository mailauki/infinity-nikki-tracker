import { AppBar, Toolbar, useTheme } from '@mui/material'

export default function SubAppBar({ children }: { children: React.ReactNode }) {
	const theme = useTheme()
  return (
    <AppBar
      position="fixed"
      sx={{
        top: 0,
				left: 0,
        backdropFilter: 'blur(8px)',
        bgcolor: 'surface.containerLowest',
        border: 'transparent',
        borderRadius: 0,
      }}
      variant="outlined"
    >
      <Toolbar />
      <Toolbar sx={{ ml: `calc(${theme.spacing(10)} + 1px)` }}>{children}</Toolbar>
    </AppBar>
  )
}
