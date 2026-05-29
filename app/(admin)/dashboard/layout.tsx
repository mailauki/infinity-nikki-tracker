import { Stack } from '@mui/material'
import DashboardNav from './dashboard-nav'
import DashboardToolbar from './dashboard-toolbar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Stack
      spacing={2}
      sx={{ flex: 1, minWidth: '300px', maxWidth: 'calc(100vw - 240px - 16px - 32px)' }}
    >
      <DashboardNav />
      {/* <DashboardToolbar /> */}
      {children}
    </Stack>
  )
}
