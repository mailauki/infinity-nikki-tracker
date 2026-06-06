import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserID, getUserRole } from '@/hooks/user'
import { FormProvider } from './form-context'
import FormToolBar from './form-toolbar'
import { Stack } from '@mui/material'
import { DashboardViewProvider } from './dashboard-view-context'
import DashboardToolBar from './dashboard-toolbar'
import { getPreferences } from '@/hooks/data/preferences'

// async function AdminGuard({ children }: { children: React.ReactNode }) {
//   const role = await getUserRole()
//   if (role !== 'admin') redirect('/')
//   return <>{children}</>
// }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <FormProvider>
        <FormToolBar />
        <AdminGuard>
          <Stack spacing={2}>{children}</Stack>
        </AdminGuard>
      </FormProvider>
    </Suspense>
  )
}
// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <Suspense>
//       <AdminGuard>
//         <Stack spacing={2}>{children}</Stack>
//       </AdminGuard>
//     </Suspense>
//   )
// }
async function AdminGuard({ children }: { children: React.ReactNode }) {
  const [role, user_id] = await Promise.all([getUserRole(), getUserID()])
  if (role !== 'admin') redirect('/admin')
  const prefs = user_id ? await getPreferences(user_id) : null
  const initialView = (prefs?.dashboard_view ?? 'list') as 'list' | 'table'

  return (
    <DashboardViewProvider initialView={initialView} userId={user_id ?? ''}>
      <DashboardToolBar />
      {children}
    </DashboardViewProvider>
  )
}
