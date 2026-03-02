'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader title="Sign up" subheader="Create a new account" />
        <CardContent>
          <form onSubmit={handleSignUp}>
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
            <TextField
              label="Password"
              id="password"
              type="password"
              required
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Repeat Password"
              id="repeat-password"
              type="password"
              required
              fullWidth
              margin="normal"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
              {isLoading ? 'Creating an account...' : 'Sign up'}
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
    </div>
  )
}
