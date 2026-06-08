import { Alert, Link as Anchor } from '@mui/material'

export default function LoginAlert() {
  return (
    <Alert severity="info" sx={{ mb: 2, whiteSpace: 'nowrap' }}>
      <Anchor color="inherit" href="/login">
        Login
      </Anchor>{' '}
      or{' '}
      <Anchor color="inherit" href="/sign-up">
        Sign up
      </Anchor>{' '}
      to track your collected Eureka
    </Alert>
  )
}
