import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import DashboardNav from '../dashboard-nav'

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const role = await getUserRole()
  if (role !== 'admin') redirect('/dashboard')
  return <>{children}</>
}

export default function EurekaDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminGuard>
        <Suspense>
          <DashboardNav />
        </Suspense>
        {children}
      </AdminGuard>
    </Suspense>
  )
}
