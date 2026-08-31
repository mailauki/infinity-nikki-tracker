'use client'

import { useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import { Button, Divider, Stack, Typography } from '@mui/material'

import DiscordIcon from '@/components/discord-icon'
import { createClient } from '@/lib/supabase/client'

type Provider = 'google' | 'discord'

export default function OAuthButtons({ next = '/' }: { next?: string }) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(provider: Provider) {
    setPending(provider)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    // On success the browser navigates away, so this only runs on failure.
    if (error) {
      setError(error.message)
      setPending(null)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Button
        fullWidth
        disabled={pending !== null}
        size="large"
        startIcon={<GoogleIcon />}
        variant="outlined"
        onClick={() => handleSignIn('google')}
      >
        {pending === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </Button>
      <Button
        fullWidth
        disabled={pending !== null}
        size="large"
        startIcon={<DiscordIcon />}
        variant="outlined"
        onClick={() => handleSignIn('discord')}
      >
        {pending === 'discord' ? 'Redirecting…' : 'Continue with Discord'}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Divider>
        <Typography color="textSecondary" variant="body">
          or
        </Typography>
      </Divider>
    </Stack>
  )
}
