import { Alert, Link as Anchor } from '@mui/material'

export default function LoginAlert() {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Anchor href="/auth/login" color="inherit">
        Login
      </Anchor>{' '}
      or{' '}
      <Anchor href="/auth/sign-up" color="inherit">
        Sign up
      </Anchor>{' '}
      to track your missing Eureka
    </Alert>
  )
}
