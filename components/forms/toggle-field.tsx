'use client'

import { FormControl, FormLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { FieldOption } from '@/lib/types/form-fields'

/**
 * The shared exclusive toggle picker (used for "Style"): an overline label, a
 * hidden input carrying the value in FormData, and a `ToggleButtonGroup`.
 */
export default function ToggleField({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string
  label: string
  options: FieldOption[]
  value: string
  onChange: (value: string) => void
}) {
  const labelId = `${name}-buttons-group-label`
  return (
    <FormControl>
      <Typography component={FormLabel} id={labelId} variant="overline">
        {label}
      </Typography>
      <input name={name} type="hidden" value={value} />
      <ToggleButtonGroup
        exclusive
        aria-labelledby={labelId}
        value={value || null}
        onChange={(_, next) => onChange(next ?? '')}
      >
        {options.map((o) => (
          <ToggleButton key={o.slug} sx={{ py: 1.25 }} value={o.slug}>
            {o.title ?? o.slug}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}
