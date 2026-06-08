import { Container, Stack } from '@mui/material'

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
      <Container maxWidth='sm'>{children}</Container>
    </Stack>
  )
}
