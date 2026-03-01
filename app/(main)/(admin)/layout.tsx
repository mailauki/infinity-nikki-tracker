import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole()

  if (role !== 'admin') redirect('/')

  return <>{children}</>
}