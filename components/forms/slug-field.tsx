'use client'

import { useState } from 'react'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'

/**
 * The shared slug input used by every add/edit form: a read-only,
 * auto-generated field with an edit-lock toggle, plus a hidden input that
 * carries the value in the submitted FormData (the visible field is disabled
 * while locked, so it would not post on its own).
 *
 * Consumers keep the slug in their own state and auto-derive it from other
 * fields; `onUserEdit` fires the first time the user unlocks and edits, so the
 * consumer can stop overwriting their manual value.
 */
export default function SlugField({
  value,
  onChange,
  onUserEdit,
  name = 'slug',
  label = 'Slug',
  helperText = 'Auto-generated — edit if needed',
  required,
}: {
  value: string
  onChange: (value: string) => void
  onUserEdit?: () => void
  name?: string
  label?: string
  helperText?: string
  required?: boolean
}) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <input name={name} type="hidden" value={value} />
      <TextField
        disabled={!editing}
        helperText={helperText}
        label={label}
        required={required}
        slotProps={{
          htmlInput: { style: { fontFamily: 'monospace' } },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={editing ? 'Lock slug' : 'Edit slug'}
                  onClick={() => setEditing((prev) => !prev)}
                >
                  {editing ? <EditOff /> : <Edit />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        value={value}
        onChange={(e) => {
          onUserEdit?.()
          onChange(e.target.value)
        }}
      />
    </>
  )
}
