import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/sign-up-success') }

export default function SignupSuccessPage() {
  return (
    <Card>
      <CardHeader subheader="Check your email" title="Thank you for signing up!" />
      <CardContent>
        <Typography color="textSecondary" variant="body">
          If that address is new, we&apos;ve sent you a confirmation link. If you already have an
          account, try signing in instead — including with Google or Discord.
        </Typography>
      </CardContent>
    </Card>
  )
}
