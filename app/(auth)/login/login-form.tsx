'use client'

import Link from 'next/link'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import OAuthButtons from '@/components/oauth-buttons'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Link as Anchor,
  TextField,
  Typography,
} from '@mui/material'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      window.location.replace('/')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader subheader="Enter your email below to login to your account" title="Login" />
        <CardContent>
          <OAuthButtons />
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              required
              autoComplete="email"
              id="email"
              label="Email"
              margin="normal"
              placeholder="m@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextField
              fullWidth
              required
              autoComplete="current-password"
              id="password"
              label="Password"
              margin="normal"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Anchor
              color="textSecondary"
              component={Link}
              href="/forgot-password"
              size="large"
              sx={{ fontWeight: 'medium' }}
              underline="hover"
              variant="body"
            >
              Forgot your password?
            </Anchor>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              fullWidth
              disabled={isLoading}
              size="large"
              sx={{ my: 2 }}
              type="submit"
              variant="contained"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography color="textSecondary" size="large" variant="body">
              Don&apos;t have an account?{' '}
              <Anchor
                color="textSecondary"
                component={Link}
                href="/sign-up"
                sx={{ fontWeight: 'medium' }}
                underline="hover"
              >
                Sign up
              </Anchor>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
