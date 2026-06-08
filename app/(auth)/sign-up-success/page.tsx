import { Card, CardContent, CardHeader, Typography } from '@mui/material'

export default function SignupSuccessPage() {
  return (
    <Card>
      <CardHeader subheader="Check your email to confirm" title="Thank you for signing up!" />
      <CardContent>
        <Typography color="textSecondary" variant="body2">
          You&apos;ve successfully signed up. Please check your email to confirm your account before
          signing in.
        </Typography>
      </CardContent>
    </Card>
  )
}
