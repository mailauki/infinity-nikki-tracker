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
import { toSlug, toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { Category, Color, EurekaSetRaw, Label, Style, Trial } from '@/lib/types/eureka'
import ColorSelect from './color-select'

export default function EditEurekaSetForm({
  eurekaSet,
  trials,
  styles,
  labels,
  colors,
  categories,
  initialColors,
  back,
}: {
  eurekaSet: EurekaSetRaw
  trials: Trial[]
  styles: Style[]
  labels: Label[]
  colors: Color[]
  categories: Category[]
  initialColors: string[]
  back?: string
}) {
  const router = useRouter()
  const backUrl = back ?? '/dashboard'
  const [title, setTitle] = useState(eurekaSet.title)
  const [slug, setSlug] = useState(eurekaSet.slug ?? toSlug(eurekaSet.title))
  const [rarity, setRarity] = useState<number | ''>(eurekaSet.rarity ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [label, setLabel] = useState(eurekaSet.label ?? '')
  const [trial, setTrial] = useState(eurekaSet.trial ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)
  const [colorSelect, setColorSelect] = useState<string[]>(initialColors)

  const handleColorChange = (event: SelectChangeEvent<typeof colorSelect>) => {
    const {
      target: { value },
    } = event
    setColorSelect(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    )
  }

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

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    const addedColors = colorSelect.filter((c) => !initialColors.includes(c))
    const removedColors = initialColors.filter((c) => !colorSelect.includes(c))

    if (addedColors.length > 0) {
      const newVariants = addedColors.flatMap((color) =>
        categories.map((cat) => ({
          eureka_set: title.trim(),
          category: cat.title,
          color,
          slug: toSlugVariant(title.trim(), cat.title ?? '', color),
        }))
      )
      const { error: insertError } = await supabase.from('eureka_variants').insert(newVariants)
      if (insertError) {
        setLoading(false)
        setError(insertError.message)
        return
      }
    }

    if (removedColors.length > 0) {
      const { error: deleteError } = await supabase
        .from('eureka_variants')
        .delete()
        .eq('eureka_set', eurekaSet.title)
        .in('color', removedColors)
      if (deleteError) {
        setLoading(false)
        setError(deleteError.message)
        return
      }
    }

    setLoading(false)
    router.push(backUrl)
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
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          required
          disabled={!editSlug}
          helperText="Used in the URL — edit with caution"
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

        <ColorSelect colorSelect={colorSelect} colors={colors} handleChange={handleColorChange} />

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href={backUrl} variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
