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
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { toSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { Color, EurekaSetRaw, Label, Style, Trial } from '@/lib/types/eureka'
import ColorSelect from './color-select'

export default function EditEurekaSetForm({
  eurekaSet,
  trials,
  styles,
  labels,
	colors,
}: {
  eurekaSet: EurekaSetRaw
  trials: Trial[]
  styles: Style[]
  labels: Label[]
	colors: Color[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(eurekaSet.title)
  const [slug, setSlug] = useState(eurekaSet.slug ?? toSlug(eurekaSet.title))
  const [rarity, setRarity] = useState<number | ''>(eurekaSet.rarity ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [label, setLabel] = useState(eurekaSet.label ?? '')
  const [trial, setTrial] = useState(eurekaSet.trial ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)
  const [colorSelect, setColorSelect] = useState<string[]>([]);

  const handleColorChange = (event: SelectChangeEvent<typeof colorSelect>) => {
    const {
      target: { value },
    } = event;
    setColorSelect(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('eureka_sets')
      .update({
        title: title.trim(),
        slug: slug.trim(),
        rarity: rarity === '' ? null : rarity,
        style: style || null,
        label: label || null,
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

        <TextField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

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
          <InputLabel>Rarity</InputLabel>
          <Select
            label="Rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {[2, 3, 4, 5].map((n) => (
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
              <MenuItem key={s.title} value={s.title!}>
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
              <MenuItem key={l.title} value={l.title!}>
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

				<ColorSelect colors={colors} colorSelect={colorSelect} handleChange={handleColorChange} />

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
