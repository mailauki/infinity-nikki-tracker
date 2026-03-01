'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Link as Anchor,
  TextField,
  Typography,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader title="Check Your Email" subheader="Password reset instructions sent" />
          <CardContent>
            <Typography color="textSecondary" variant="body2">
              If you registered using your email and password, you will receive a password reset
              email.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Reset Your Password"
            subheader="Type in your email and we'll send you a link to reset your password"
          />
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <TextField
                label="Email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disabled={isLoading}
                sx={{ my: 2 }}
              >
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>
              <Typography color="textSecondary" variant="body1">
                Already have an account?{' '}
                <Anchor
                  color="textSecondary"
                  fontWeight="medium"
                  href="/auth/login"
                  component={Link}
                  underline="hover"
                >
                  Login
                </Anchor>
              </Typography>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
