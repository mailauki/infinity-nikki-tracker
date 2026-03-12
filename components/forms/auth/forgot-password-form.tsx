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
          <CardHeader subheader="Password reset instructions sent" title="Check Your Email" />
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
            subheader="Type in your email and we'll send you a link to reset your password"
            title="Reset Your Password"
          />
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <TextField
                fullWidth
                required
                id="email"
                label="Email"
                margin="normal"
                placeholder="m@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                fullWidth
                disabled={isLoading}
                size="large"
                sx={{ my: 2 }}
                type="submit"
                variant="contained"
              >
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>
              <Typography color="textSecondary" variant="body1">
                Already have an account?{' '}
                <Anchor
                  color="textSecondary"
                  component={Link}
                  fontWeight="medium"
                  href="/auth/login"
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
