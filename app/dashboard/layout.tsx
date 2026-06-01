import { Stack } from '@mui/material'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // <Box sx={{ flex: 1, minWidth: '300px', maxWidth: 'calc(100vw - 240px - 16px - 32px)' }}>
    <>
      <Stack spacing={2}>{children}</Stack>
    </>
    // </Box>
  )
}
