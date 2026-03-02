'use client'

import { useState } from 'react'
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

type EurekaVariantRow = {
  id: number
  eureka_set: string | null
  category: string | null
  color: string | null
  image_url: string | null
  default: boolean
  slug: string | null
}

type EurekaSetOption = { id: number; slug: string | null; name: string }

export default function EditEurekaVariantForm({
  variant,
  eurekaSets,
  categories,
  colors,
}: {
  variant: EurekaVariantRow
  eurekaSets: EurekaSetOption[]
  categories: { name: string }[]
  colors: { name: string }[]
}) {
  const router = useRouter()
  const [eurekaSet, setEurekaSet] = useState(variant.eureka_set ?? '')
  const [category, setCategory] = useState(variant.category ?? '')
  const [color, setColor] = useState(variant.color ?? '')
  const [imageUrl, setImageUrl] = useState(variant.image_url ?? '')
  const [isDefault, setIsDefault] = useState(variant.default)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(
    variant.slug ??
      toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')
  )
  const [editSlug, setEditSlug] = useState<boolean>(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('eureka_variants')
      .update({
        eureka_set: eurekaSet || null,
        category: category || null,
        color: color || null,
        image_url: imageUrl.trim() || null,
        default: isDefault,
        slug: slug || null,
      })
      .eq('id', variant.id)

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
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" href="/eureka-variant">
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
