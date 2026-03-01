'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { toEurekaSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'

export default function AddEurekaSetForm({ trials }: { trials: { name: string }[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [quality, setQuality] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [labels, setLabels] = useState('')
  const [trial, setTrial] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!editSlug) setSlug(toEurekaSlug(value))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('eureka_sets').insert([
      {
        name: name.trim(),
        slug: slug.trim(),
        quality: quality === '' ? null : quality,
        style: style.trim() || null,
        labels: labels.trim() || null,
        trial: trial || null,
      },
    ])

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/eureka-set')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Auto-generated from name — edit if needed"
          slotProps={{
            htmlInput: { style: { fontFamily: 'monospace' } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditSlug(!editSlug)}>
                    {editSlug ? <EditOff /> : <Edit />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl>
          <InputLabel>Quality</InputLabel>
          <Select
            label="Quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Style" value={style} onChange={(e) => setStyle(e.target.value)} />

        <TextField
          label="Labels"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          helperText="Comma-separated tags"
        />

        <FormControl>
          <InputLabel>Trial</InputLabel>
          <Select label="Trial" value={trial} onChange={(e) => setTrial(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {trials.map((t) => (
              <MenuItem key={t.name} value={t.name}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" href="/dashboard">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Add Eureka Set'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
