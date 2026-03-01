import { Suspense } from 'react'
import NavDrawer from '@/components/navbar/nav-drawer'
import NavSkeleton from '@/components/navbar/nav-skeleton'
import NavTabs from '@/components/navbar/nav-tabs'
import { getUserClaims, getUserRole } from '@/hooks/user'

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<NavSkeleton />}>
      <NavContainer>{children}</NavContainer>
    </Suspense>
  )
}

async function NavContainer({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const role = await getUserRole()
  const user = await getUserClaims()

  return (
    <NavDrawer isAdmin={role === 'admin'} user={user!}>
      <NavTabs />
      <div className="h-[calc(100vh-192px)] overflow-y-auto bg-background">{children}</div>
    </NavDrawer>
  )
}
