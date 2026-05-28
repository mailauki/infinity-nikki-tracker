import { Stack } from '@mui/material'
import NavRail from '@/components/navbar/nav-rail'
import Footer from '@/components/navbar/nav-footer'
import NavAppBar from '@/components/navbar/nav-appbar'
import { StyledToolbar } from '@/components/navbar/nav-styled'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavAppBar />
      <Stack
        direction="row"
        spacing={2}
        sx={{ minHeight: '100vh', p: 2, backgroundColor: 'surface.containerLowest' }}
      >
        <NavRail />
        <Stack spacing={2} sx={{ flex: 1, minWidth: '300px' }}>
          <StyledToolbar />
          {children}
        </Stack>
      </Stack>
      <Footer />
    </>
  )
}
