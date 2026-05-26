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
        <CardHeader subheader="Create a new account" title="Sign up" />
        <CardContent>
          <form onSubmit={handleSignUp}>
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
            <TextField
              fullWidth
              required
              id="password"
              label="Password"
              margin="normal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              fullWidth
              required
              id="repeat-password"
              label="Repeat Password"
              margin="normal"
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
              {isLoading ? 'Creating an account...' : 'Sign up'}
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
    </div>
  )
}
