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
import { toSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'

type EurekaSetRow = {
  id: number
  name: string
  slug: string | null
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
}

export default function EditEurekaSetForm({
  eurekaSet,
  trials,
}: {
  eurekaSet: EurekaSetRow
  trials: { name: string }[]
}) {
  const router = useRouter()
  const [name, setName] = useState(eurekaSet.name)
  const [slug, setSlug] = useState(eurekaSet.slug ?? '')
  const [quality, setQuality] = useState<number | ''>(eurekaSet.quality ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [labels, setLabels] = useState(eurekaSet.labels ?? '')
  const [trial, setTrial] = useState(eurekaSet.trial ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('eureka_sets')
      .update({
        name: name.trim(),
        slug: slug.trim(),
        quality: quality === '' ? null : quality,
        style: style.trim() || null,
        labels: labels.trim() || null,
        trial: trial || null,
      })
      .eq('id', eurekaSet.id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
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
          onChange={(e) => {
            setName(e.target.value)
            setSlug(toSlug(e.target.value))
          }}
        />

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
