import { Suspense } from 'react'
import NavContainer from '@/components/navbar/nav-container'
import NavSkeleton from '@/components/navbar/nav-skeleton'
import { getUserClaims, getUserRole } from '@/hooks/user'

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<NavSkeleton />}>
      <NavigationContainer>{children}</NavigationContainer>
    </Suspense>
  )
}

async function NavigationContainer({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const role = await getUserRole()
  const user = await getUserClaims()

  return (
    <NavContainer isAdmin={role === 'admin'} user={user!}>
      {children}
    </NavContainer>
  )
}
