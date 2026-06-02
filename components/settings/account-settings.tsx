'use client'

import { useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/settings/actions'

function ChangeEmailSection() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Change email</Typography>
      <Stack component="form" spacing={1} onSubmit={handleSubmit}>
        <TextField
          label="New email"
          size="small"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {success && <Alert severity="success">Confirmation sent to your new email</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button disabled={loading || !email} type="submit" variant="outlined">
          {loading ? 'Saving…' : 'Update email'}
        </Button>
      </Stack>
    </Stack>
  )
}

function ChangePasswordSection() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (mismatch) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Change password</Typography>
      <Stack component="form" spacing={1} onSubmit={handleSubmit}>
        <TextField
          label="New password"
          size="small"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          error={mismatch}
          helperText={mismatch ? 'Passwords do not match' : undefined}
          label="Confirm password"
          size="small"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {success && <Alert severity="success">Password updated</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          disabled={loading || !password || !confirm || mismatch}
          type="submit"
          variant="outlined"
        >
          {loading ? 'Saving…' : 'Update password'}
        </Button>
      </Stack>
    </Stack>
  )
}

function DangerZoneSection() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await deleteAccount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Danger zone</Typography>
      <Button
        color="error"
        sx={{ alignSelf: 'flex-start' }}
        variant="outlined"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your account and all your data. This cannot be undone.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button color="error" disabled={loading} variant="contained" onClick={handleDelete}>
            {loading ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function AdminAccessSection() {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Admin access</Typography>
      <Typography color="textSecondary" variant="body2">
        Admin access lets you manage Eureka sets, variants, and trials from the dashboard.
      </Typography>
      <Button
        component="a"
        href="mailto:julie.ux.dev@gmail.com?subject=Admin%20Access%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20admin%20access%20for%20the%20Infinity%20Nikki%20Tracker."
        sx={{ alignSelf: 'flex-start' }}
        variant="outlined"
      >
        Request admin access
      </Button>
    </Stack>
  )
}

export default function AccountSettings({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Container maxWidth="sm" sx={{ mx: 0 }}>
      <Stack spacing={3}>
        <ChangeEmailSection />
        <ChangePasswordSection />
        <Divider />
        {!isAdmin && <AdminAccessSection />}
        {!isAdmin && <Divider />}
        <DangerZoneSection />
      </Stack>
    </Container>
  )
}
