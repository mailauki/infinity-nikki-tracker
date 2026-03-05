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
  title: string
  slug: string | null
  rarity: number | null
  style: string | null
  label: string | null
  trial: string | null
}

export default function EditEurekaSetForm({
  eurekaSet,
  trials,
  styles,
  labels,
}: {
  eurekaSet: EurekaSetRow
  trials: { title: string }[]
  styles: { title: string }[]
  labels: { title: string }[]
}) {
  const router = useRouter()
  const [name, setName] = useState(eurekaSet.title)
  const [slug, setSlug] = useState(eurekaSet.slug ?? toSlug(eurekaSet.title))
  const [quality, setQuality] = useState<number | ''>(eurekaSet.rarity ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [label, setLabel] = useState(eurekaSet.label ?? '')
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
        title: name.trim(),
        slug: slug.trim(),
        rarity: quality === '' ? null : quality,
        style: style || null,
        label: labels.trim() || null,
        trial: trial || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eurekaSet.id)

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

        <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Used in the URL — edit with caution"
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

        <FormControl>
          <InputLabel>Style</InputLabel>
          <Select label="Style" value={style} onChange={(e) => setStyle(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {styles.map((s) => (
              <MenuItem key={s.title} value={s.title}>
                {s.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Label</InputLabel>
          <Select label="Label" value={label} onChange={(e) => setLabel(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {labels.map((l) => (
              <MenuItem key={l.title} value={l.title}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Trial</InputLabel>
          <Select label="Trial" value={trial} onChange={(e) => setTrial(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {trials.map((t) => (
              <MenuItem key={t.title} value={t.title}>
                {t.title}
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
