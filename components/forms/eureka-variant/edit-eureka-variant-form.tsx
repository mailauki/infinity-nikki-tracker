'use client'

import { useState } from 'react'
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

export default function EditEurekaVariantForm({
  variant,
  eurekaSets,
  categories,
  colors,
  variants,
  back,
}: {
  variant: EurekaVariantRaw
  eurekaSets: EurekaSetRaw[]
  categories: Category[]
  colors: Color[]
  variants: EurekaVariantRaw[]
  back?: string
}) {
  const router = useRouter()
  const backUrl = back ?? '/dashboard'
  const [eurekaSet, setEurekaSet] = useState(variant.eureka_set ?? '')
  const [category, setCategory] = useState(variant.category ?? '')
  const [color, setColor] = useState(variant.color ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(
    variant.slug ??
      toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')
  )
  const [editSlug, setEditSlug] = useState<boolean>(false)

  const hasDefault = variants.some(
    (v) => v.id !== variant.id && v.eureka_set === eurekaSet && v.default
  )

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
        image_url: imageUrl || null,
        default: isDefault,
        slug: slug || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variant.id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push(backUrl)
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
            slug={variant.slug ?? undefined}
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
