import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const role = await getUserRole()
  if (role !== 'admin') redirect('/')
  return <>{children}</>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  )
}
