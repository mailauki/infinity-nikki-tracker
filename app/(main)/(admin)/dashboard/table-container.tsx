import { Paper } from '@mui/material'

export default function TableContainer({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Paper
      sx={{
        height: '100%',
        minHeight: '592px',
        borderRadius: 4,
        overflowY: 'clip',
        overflowX: 'auto',
        bgcolor: 'surface.containerLowest',
      }}
      variant="outlined"
    >
      {children}
    </Paper>
  )
}
