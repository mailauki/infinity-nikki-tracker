'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, Card, CardContent, CardHeader, TextField } from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/protected')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader subheader="Please enter your new password below." title="Reset Your Password" />
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <TextField
              fullWidth
              required
              id="password"
              label="New password"
              margin="normal"
              placeholder="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Saving...' : 'Save new password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
