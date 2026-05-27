import { Suspense } from 'react'
import NavSkeleton from '@/components/navbar/nav-skeleton'
import NavContainer from '@/components/navbar/nav-container'
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
    <NavContainer isAdmin={role === 'admin'} user={user}>
      {children}
    </NavContainer>
    // <Stack direction="row" spacing={2} sx={{ px: 2 }}>
    //   <NavRail />
    //   <Stack
    //     spacing={2}
    //     sx={{ flex: 1, minWidth: '300px', maxWidth: 'calc(100vw - 240px - 16px - 32px)' }}
    //   >
    //     {children}
    //   </Stack>
    // </Stack>
  )
}
