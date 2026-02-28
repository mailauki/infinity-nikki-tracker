import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import Container from '@mui/material/Container'
import NavDrawer from '@/components/nav-drawer'
import NavTabs from '@/components/nav-tabs'

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const role = await getUserRole()

  if (role !== 'admin') {
    redirect('/')
  }

  return (
    <NavDrawer isAdmin>
      <NavTabs />
      <div className="h-[calc(100vh-192px)] overflow-y-auto">
        <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
          {children}
        </Container>
      </div>
    </NavDrawer>
  )
}
