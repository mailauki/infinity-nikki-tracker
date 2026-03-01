import { Card, CardContent, CardHeader, Typography } from '@mui/material'

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader title="Thank you for signing up!" subheader="Check your email to confirm" />
          <CardContent>
            <Typography color="textSecondary" variant="body2">
              You&apos;ve successfully signed up. Please check your email to confirm your account
              before signing in.
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
