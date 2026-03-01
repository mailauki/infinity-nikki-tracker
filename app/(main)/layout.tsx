import { Suspense } from 'react'
import Container from '@mui/material/Container'
import NavDrawer from '@/components/nav-drawer'
import NavSkeleton from '@/components/nav-skeleton'
import NavTabs from '@/components/nav-tabs'
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
      <div className="h-[calc(100vh-192px)] overflow-y-auto">
        <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
          {children}
        </Container>
      </div>
    </NavDrawer>
  )
}
