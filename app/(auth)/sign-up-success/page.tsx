import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/sign-up-success') }

export default function SignupSuccessPage() {
  return (
    <Card>
      <CardHeader subheader="Check your email to confirm" title="Thank you for signing up!" />
      <CardContent>
        <Typography color="textSecondary" variant="body">
          You&apos;ve successfully signed up. Please check your email to confirm your account before
          signing in.
        </Typography>
      </CardContent>
    </Card>
  )
}
