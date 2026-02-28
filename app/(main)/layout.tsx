import Container from '@mui/material/Container'
import NavDrawer from '@/components/nav-drawer'
import NavTabs from '@/components/nav-tabs'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <NavDrawer>
      <NavTabs />
      <div className="h-[calc(100vh-192px)] overflow-y-auto">
        <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
          {children}
        </Container>
      </div>
    </NavDrawer>
  )
}
