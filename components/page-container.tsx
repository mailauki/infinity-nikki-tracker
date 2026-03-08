import { Container, Stack, Typography } from '@mui/material'

export default function PageContainer({
  children,
  title,
  size = 'md',
}: Readonly<{
  children: React.ReactNode
  title?: string
  size?: 'sm' | 'md'
}>) {
  return (
    <Container maxWidth={size} sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        {title && (
          <Typography variant="h3" component="h1">
            {title}
          </Typography>
        )}
        {children}
      </Stack>
    </Container>
  )
}
