'use client'

import { useCallback, useEffect, useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import { Alert, Button, Divider, Stack, Typography } from '@mui/material'

import DiscordIcon from '@/components/discord-icon'
import { removableProviders, type IdentitySummary } from '@/lib/identity-guard'
import { createClient } from '@/lib/supabase/client'
import { getHasPassword } from '@/app/settings/actions'

const PROVIDERS = [
  { id: 'email', label: 'Email and password', icon: MailOutlineIcon },
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'discord', label: 'Discord', icon: DiscordIcon },
] as const

type Identity = IdentitySummary & {
  id: string
  user_id: string
  identity_id: string
  email?: string
}

export default function ConnectedAccounts() {
  const [identities, setIdentities] = useState<Identity[] | null>(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data, error }, passwordSet] = await Promise.all([
      supabase.auth.getUserIdentities(),
      getHasPassword(),
    ])
    if (error) setError(error.message)
    setIdentities((data?.identities ?? []) as Identity[])
    setHasPassword(passwordSet)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleConnect(provider: 'google' | 'discord') {
    setPending(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/settings')}`,
      },
    })
    if (error) {
      setError(error.message)
      setPending(null)
    }
  }

  async function handleDisconnect(identity: Identity) {
    setPending(identity.provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.unlinkIdentity(identity)
    if (error) setError(error.message)
    else await load()
    setPending(null)
  }

  const removable = identities ? removableProviders(identities, hasPassword) : new Set<string>()

  return (
    <Stack spacing={2}>
      <Divider />
      <Typography component="h2" size="large" variant="title">
        Connected accounts
      </Typography>
      <Typography color="textSecondary" variant="body">
        Sign in to your account with any of these. You can connect more than one.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {identities === null ? (
        <Typography color="textSecondary" variant="body">
          Loading…
        </Typography>
      ) : (
        PROVIDERS.map(({ id, label, icon: Icon }) => {
          const identity = identities.find((i) => i.provider === id)
          const canRemove = removable.has(id)

          return (
            <Stack
              key={id}
              spacing={2}
              sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack spacing={1.5} sx={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon />
                <Stack>
                  <Typography variant="body">{label}</Typography>
                  <Typography color="textSecondary" size="small" variant="body">
                    {identity ? (identity.email ?? 'Connected') : 'Not connected'}
                  </Typography>
                </Stack>
              </Stack>

              {identity ? (
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Button
                    disabled={!canRemove || pending !== null}
                    size="small"
                    variant="outlined"
                    onClick={() => handleDisconnect(identity)}
                  >
                    {pending === id ? 'Working…' : 'Disconnect'}
                  </Button>
                  {!canRemove && (
                    <Typography color="textSecondary" size="small" variant="body">
                      This is your only sign-in method
                    </Typography>
                  )}
                </Stack>
              ) : (
                id !== 'email' && (
                  <Button
                    disabled={pending !== null}
                    size="small"
                    variant="outlined"
                    onClick={() => handleConnect(id)}
                  >
                    {pending === id ? 'Redirecting…' : 'Connect'}
                  </Button>
                )
              )}
            </Stack>
          )
        })
      )}
    </Stack>
  )
}
