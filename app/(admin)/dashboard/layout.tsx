import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserID, getUserRole } from '@/hooks/user'
import { getPreferences } from '@/hooks/data/preferences'
import { Stack } from '@mui/material'
import { DashboardViewProvider } from './dashboard-view-context'
import DashboardToolBar from './dashboard-toolbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminGuard>
        <Stack spacing={2}>{children}</Stack>
      </AdminGuard>
    </Suspense>
  )
}
async function AdminGuard({ children }: { children: React.ReactNode }) {
  const [role, user_id] = await Promise.all([getUserRole(), getUserID()])
  if (role !== 'admin') redirect('/dashboard')
  const prefs = user_id ? await getPreferences(user_id) : null
  const initialView = (prefs?.dashboard_view ?? 'list') as 'list' | 'table'

  return (
    <DashboardViewProvider initialView={initialView} userId={user_id ?? ''}>
      <DashboardToolBar />
      {children}
    </DashboardViewProvider>
  )
}
