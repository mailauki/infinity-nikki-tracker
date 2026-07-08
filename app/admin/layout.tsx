import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserID, getUserRole } from '@/hooks/user'
import { FormProvider } from './form-context'
import FormToolBar from './form-toolbar'
import { Stack } from '@mui/material'
import { AdminViewProvider } from './admin-view-context'
import AdminToolBar from './admin-toolbar'
import { getAdminPreferences } from '@/hooks/data/preferences'
import AdminToggleToolbar from './admin-toggle-toolbar'
import PageShell from '@/components/page-shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <FormProvider>
        <FormToolBar />
        <AdminGuard>
          <PageShell>
            <Stack spacing={2}>{children}</Stack>
          </PageShell>
        </AdminGuard>
      </FormProvider>
    </Suspense>
  )
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const [role, user_id] = await Promise.all([getUserRole(), getUserID()])
  if (role !== 'admin') redirect('/')
  const prefs = user_id ? await getAdminPreferences(user_id) : null
  const initialView = (prefs?.admin_view ?? 'list') as 'list' | 'table'

  return (
    <AdminViewProvider initialView={initialView} userId={user_id ?? ''}>
      <AdminToolBar />
      <AdminToggleToolbar />
      {children}
    </AdminViewProvider>
  )
}
