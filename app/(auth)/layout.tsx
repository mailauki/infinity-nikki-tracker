import { Container, Stack, Toolbar } from '@mui/material'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Stack
      sx={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <Toolbar />
      <Container maxWidth="sm">{children}</Container>
    </Stack>
  )
}
