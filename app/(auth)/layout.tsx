import AuthAppBar from '@/components/navbar/auth-appbar'
import { Stack } from '@mui/material'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Stack
      sx={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* <AuthAppBar /> */}
      {children}
    </Stack>
  )
}
