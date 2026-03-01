'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'

type EurekaSetOption = { id: number; slug: string | null; name: string }

export default function AddEurekaVariantForm({
  eurekaSets,
  categories,
  colors,
}: {
  eurekaSets: EurekaSetOption[]
  categories: { name: string }[]
  colors: { name: string }[]
}) {
  const router = useRouter()
  const [eurekaSet, setEurekaSet] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState<boolean>(false)

  useEffect(() => {
    if (!editSlug && eurekaSet && category && color) {
      setSlug(toSlugVariant(eurekaSet, category, color))
    }
  }, [eurekaSet, category, color, editSlug])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('eureka_variants').insert([
      {
        eureka_set: eurekaSet || null,
        category: category || null,
        color: color || null,
        image_url: imageUrl.trim() || null,
        default: isDefault,
        slug: slug || null,
      },
    ])

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/eureka-variant')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl required>
          <InputLabel>Eureka Set</InputLabel>
          <Select
            label="Eureka Set"
            value={eurekaSet}
            onChange={(e) => setEurekaSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {eurekaSets.map((set) => (
              <MenuItem key={set.id} value={set.name ?? ''}>
                {set.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.name} value={c.name}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Color</InputLabel>
          <Select label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {colors.map((c) => (
              <MenuItem key={c.name} value={c.name}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Auto-generated from name, category, and color — edit if needed"
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

        <TextField
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
        />

        <FormControlLabel
          control={<Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />}
          label="Default variant"
          // helperText="Used for the eureka set thumbnail - limit one per set"
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" href="/eureka-variant">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Add Eureka Variant'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
