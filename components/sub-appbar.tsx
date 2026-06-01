import { AppBar, Toolbar } from '@mui/material'

export default function SubAppBar({ children }: { children: React.ReactNode }) {
  return (
    <AppBar
      color="inherit"
      position="sticky"
      sx={{
        borderColor: 'transparent',
        backgroundColor: 'surface.containerLowest',
        borderRadius: 0,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        marginTop: '-190px',
      }}
      variant="outlined"
    >
      <Toolbar sx={{ mb: 1 }} />
      <Toolbar>{children}</Toolbar>
    </AppBar>
  )
}
