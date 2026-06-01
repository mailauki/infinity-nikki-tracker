import { AppBar, Toolbar } from '@mui/material'

export default function SubAppBar({ children }: { children: React.ReactNode }) {
  return (
    <AppBar
      color="default"
      position="fixed"
      sx={{
        top: 0,
        left: 0,
        borderColor: 'transparent',
        borderRadius: 0,
      }}
      variant="outlined"
    >
      <Toolbar />
      <Toolbar sx={{ ml: (theme) => `calc(${theme.spacing(10)} + 1px)` }}>{children}</Toolbar>
    </AppBar>
  )
}
