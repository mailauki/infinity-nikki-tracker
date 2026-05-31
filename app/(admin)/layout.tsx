import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { FormProvider } from './form-context'
import FormToolBar from './form-toolbar'

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const role = await getUserRole()
  if (role !== 'admin') redirect('/')
  return <>{children}</>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <FormProvider>
        <FormToolBar />
        <AdminGuard>{children}</AdminGuard>
      </FormProvider>
    </Suspense>
  )
}
