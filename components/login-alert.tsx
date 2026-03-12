import { Alert, Link as Anchor } from '@mui/material'

export default function LoginAlert() {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Anchor color="inherit" href="/auth/login">
        Login
      </Anchor>{' '}
      or{' '}
      <Anchor color="inherit" href="/auth/sign-up">
        Sign up
      </Anchor>{' '}
      to track your collected Eureka
    </Alert>
  )
}
