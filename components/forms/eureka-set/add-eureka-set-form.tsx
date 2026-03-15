'use client'

import { useEffect, useState } from 'react'
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
import { toSlug, toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { Category, Color, Label, Style, Trial } from '@/lib/types/eureka'
import ColorSelect from './color-select'

export default function AddEurekaSetForm({
  trials,
  styles,
  labels,
  colors,
  categories,
}: {
  trials: Trial[]
  styles: Style[]
  labels: Label[]
  colors: Color[]
  categories: Category[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [selectedTrials, setSelectedTrials] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)
  const [colorSelect, setColorSelect] = useState<string[]>([])

  const maxColorsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxColors = typeof rarity === 'number' ? (maxColorsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setColorSelect((prev) => (prev.length > maxColors ? prev.slice(0, maxColors) : prev))
  }, [maxColors])

  const handleColorChange = (event: SelectChangeEvent<typeof colorSelect>) => {
    const {
      target: { value },
    } = event
    setColorSelect(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    )
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('eureka_sets').insert([
      {
        title: title.trim(),
        slug: slug.trim(),
        rarity: rarity === '' ? null : rarity,
        style: style || null,
        label: label || null,
      },
    ])

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    const rollback = async () => {
      await supabase.from('eureka_sets').delete().eq('slug', slug.trim())
    }

    if (selectedTrials.length > 0) {
      const { error: trialsError } = await supabase
        .from('eureka_set_trials')
        .insert(selectedTrials.map((t) => ({ eureka_set: slug.trim(), trial: t })))
      if (trialsError) {
        await rollback()
        setLoading(false)
        setError('Failed to save trials. The set was not created — please try again.')
        return
      }
    }

    if (colorSelect.length > 0) {
      const variants = colorSelect.flatMap((color) =>
        categories.map((cat) => ({
          eureka_set: slug.trim(),
          category: cat.slug,
          color,
          slug: toSlugVariant(slug.trim(), cat.slug, color),
        }))
      )
      const { error: variantError } = await supabase.from('eureka_variants').insert(variants)
      if (variantError) {
        await rollback()
        setLoading(false)
        setError('Failed to save variants. The set was not created — please try again.')
        return
      }
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          required
          label="Title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from name — edit if needed"
          label="Slug"
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
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
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
              <MenuItem key={s.slug} value={s.slug}>
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
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Trials</InputLabel>
          <Select
            multiple
            label="Trials"
            renderValue={(selected) =>
              trials
                .filter((t) => selected.includes(t.slug!))
                .map((t) => t.title)
                .join(', ')
            }
            value={selectedTrials}
            onChange={(e) =>
              setSelectedTrials(
                typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
              )
            }
          >
            {trials.map((t) => (
              <MenuItem key={t.slug} value={t.slug!}>
                {t.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ColorSelect colorSelect={colorSelect} colors={colors} handleChange={handleColorChange} maxColors={maxColors} />

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href="/dashboard" variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Add Eureka Set'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
