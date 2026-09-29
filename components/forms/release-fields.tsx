'use client'

import { Stack, TextField } from '@mui/material'
import { formatRelease, type Release } from '@/hooks/release'

// The two release inputs, side by side. `inherited` is what a blank field falls
// back to; showing it makes an empty override read as a choice, not a gap.
// Omit it on seasons and trials, which are the sources themselves.
export default function ReleaseFields({
  defaultReleasedAt,
  defaultVersion,
  inherited,
}: {
  defaultReleasedAt?: string | null
  defaultVersion?: string | null
  inherited?: Release | null
}) {
  const inheritedText = inherited ? formatRelease(inherited) : null
  const helperText =
    inherited === undefined
      ? undefined
      : inheritedText
        ? `Blank inherits ${inheritedText}`
        : 'Blank inherits from its season'

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        fullWidth
        defaultValue={defaultReleasedAt ?? ''}
        helperText={helperText}
        label="Released"
        name="released_at"
        slotProps={{ inputLabel: { shrink: true } }}
        type="date"
      />
      <TextField
        fullWidth
        defaultValue={defaultVersion ?? ''}
        label="Version"
        name="version"
        placeholder="1.5"
      />
    </Stack>
  )
}
