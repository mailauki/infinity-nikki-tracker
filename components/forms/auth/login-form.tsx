'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
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
  const router = useRouter()

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
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push('/profile')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader title="Login" subheader="Enter your email below to login to your account" />
        <CardContent>
          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              fullWidth
              margin="normal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextField
              label="Password"
              id="password"
              type="password"
              required
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Anchor
              color="textSecondary"
              fontWeight="medium"
              variant="body1"
              href="/auth/forgot-password"
              component={Link}
              underline="hover"
            >
              Forgot your password?
            </Anchor>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              fullWidth
              size="large"
              variant="contained"
              disabled={isLoading}
              sx={{ my: 2 }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography color="textSecondary" variant="body1">
              Don&apos;t have an account?{' '}
              <Anchor
                color="textSecondary"
                fontWeight="medium"
                href="/auth/sign-up"
                component={Link}
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
