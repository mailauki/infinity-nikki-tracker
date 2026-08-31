'use client'

import { useCallback, useEffect, useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import {
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'

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
    try {
      const supabase = createClient()
      const [{ data, error }, passwordSet] = await Promise.all([
        supabase.auth.getUserIdentities(),
        getHasPassword(),
      ])
      if (error) setError(error.message)
      setIdentities((data?.identities ?? []) as Identity[])
      setHasPassword(passwordSet)
    } catch (err) {
      // getHasPassword() throws on RPC error. Leave hasPassword at its
      // `false` default here rather than guessing `true`: an unknown
      // password state must not make the unlink guard more permissive, so
      // `false` keeps removableProviders() conservative and Disconnect
      // buttons disabled instead of wrongly enabled.
      setError(err instanceof Error ? err.message : 'Could not load your connected accounts')
      setIdentities([])
    }
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
      <Stack>
        <Typography component="h2" size="large" variant="title">
          Connected accounts
        </Typography>
        <Typography color="textSecondary" variant="body">
          Sign in to your account with any of these. You can connect more than one.
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <List>
        {identities === null ? (
          // component="li" because List renders a <ul>, so a bare span here
          // would be invalid markup — same reason the Dividers in
          // app/admin/admin-list.tsx carry it.
          <Typography color="textSecondary" component="li" variant="body">
            Loading…
          </Typography>
        ) : (
          PROVIDERS.map(({ id, label, icon: Icon }) => {
            const identity = identities.find((i) => i.provider === id)
            const canRemove = removable.has(id)

            return (
              <ListItem key={id} disablePadding>
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  secondary={identity ? (identity.email ?? 'Connected') : 'Not connected'}
                />

                {identity ? (
                  <Stack sx={{ alignItems: 'flex-end' }}>
                    <Button
                      color="secondary"
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
              </ListItem>
            )
          })
        )}
      </List>
    </Stack>
  )
}
