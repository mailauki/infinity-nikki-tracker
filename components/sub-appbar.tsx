import { AppBar, Toolbar } from '@mui/material'

export default function SubAppBar({ children }: { children: React.ReactNode }) {
  return (
    <AppBar
      color="inherit"
      position="fixed"
      sx={{
        top: 0,
        left: 0,
        borderColor: 'transparent',
        backgroundColor: 'surface.containerLowest',
        borderRadius: 0,
      }}
      variant="outlined"
    >
      <Toolbar />
      <Toolbar sx={{ ml: (theme) => `calc(${theme.spacing(10)} + 21px)` }}>{children}</Toolbar>
    </AppBar>
  )
}
