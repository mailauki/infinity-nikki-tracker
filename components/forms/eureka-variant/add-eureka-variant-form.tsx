'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
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
import ImageUpload from '@/components/forms/image-upload'
import { Category, Color, EurekaSetRaw, EurekaVariantRaw } from '@/lib/types/eureka'

export default function AddEurekaVariantForm({
  eurekaSets,
  categories,
  colors,
  variants,
}: {
  eurekaSets: EurekaSetRaw[]
  categories: Category[]
  colors: Color[]
  variants: EurekaVariantRaw[]
}) {
  const router = useRouter()
  const [eurekaSet, setEurekaSet] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState<boolean>(false)

  const hasDefault = variants.some((v) => v.eureka_set === eurekaSet && v.default)

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
        image_url: imageUrl || null,
        default: isDefault,
        slug: slug || toSlugVariant(eurekaSet, category, color),
      },
    ])

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

        <FormControl required>
          <InputLabel>Eureka Set</InputLabel>
          <Select
            label="Eureka Set"
            value={eurekaSet}
            onChange={(e) => setEurekaSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {eurekaSets.map((set) => (
              <MenuItem key={set.id} value={set.slug ?? ''}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Color</InputLabel>
          <Select label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {colors.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from name, category, and color — edit if needed"
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

        <Stack spacing={0.5}>
          <FormLabel>Image</FormLabel>
          <ImageUpload
            slug={slug}
            table="eureka_variants"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>

        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isDefault}
                disabled={hasDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label="Default variant"
          />
          <FormHelperText>
            {hasDefault
              ? 'This set already has a default variant'
              : 'Used to determine the Eureka set thumbnail image — limit one per set'}
          </FormHelperText>
        </FormControl>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href="/eureka-variant" variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Add Eureka Variant'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
