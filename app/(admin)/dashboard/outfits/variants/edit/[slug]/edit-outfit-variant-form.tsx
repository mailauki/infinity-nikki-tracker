'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import ImageUpload from '@/components/forms/image-upload'
import { Evolution, OutfitCategory, OutfitSetRaw, OutfitVariantRaw } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editOutfitVariant } from '../../actions'

const FORM_ID = 'edit-outfit-variant'

export default function EditOutfitVariantForm({
  variant,
  outfitSets,
  outfitCategories,
  evolutions,
  variants,
  back,
}: {
  variant: OutfitVariantRaw
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
  variants: OutfitVariantRaw[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState(variant.outfit_set ?? '')
  const [outfitCategory, setOutfitCategory] = useState(variant.outfit_category ?? '')
  const [evolution, setEvolution] = useState(variant.evolution ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [altImageUrl, setAltImageUrl] = useState<string | null>(variant.alt_image_url ?? null)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [slug, setSlug] = useState(
    variant.slug ??
      toSlugVariant(
        variant.outfit_set ?? '',
        variant.outfit_category ?? '',
        variant.evolution ?? ''
      )
  )
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) =>
      v.id !== variant.id &&
      v.outfit_set === outfitSet &&
      v.outfit_category === outfitCategory &&
      v.default
  )

  const boundAction = editOutfitVariant.bind(null, variant.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: back, pending })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  const autoSlug =
    outfitSet && outfitCategory && evolution
      ? toSlugVariant(outfitSet, outfitCategory, evolution)
      : (variant.slug ?? '')
  const currentSlug = editSlug ? slug : autoSlug

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl required>
          <InputLabel>Outfit Set</InputLabel>
          <Select
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitSets.map((set) => (
              <MenuItem key={set.id} value={set.slug ?? ''}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            name="outfit_category"
            value={outfitCategory}
            onChange={(e) => setOutfitCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitCategories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.part}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Evolution</InputLabel>
          <Select
            label="Evolution"
            name="evolution"
            value={evolution}
            onChange={(e) => setEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutions.map((e) => (
              <MenuItem key={e.slug} value={e.slug}>
                {e.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <input name="slug" type="hidden" value={currentSlug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from set, category, and evolution — edit if needed"
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
          value={currentSlug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          slug={currentSlug || undefined}
          table="outfit_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />

        <ImageUpload
          column="alt_image_url"
          slug={currentSlug || undefined}
          table="outfit_variants"
          url={altImageUrl}
          onUpload={(url) => setAltImageUrl(url)}
        />

        <input name="default" type="hidden" value={String(hasDefault ? false : isDefault)} />
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
              ? 'This category already has a default variant for this set'
              : 'Used to determine the outfit set thumbnail image — limit one per category'}
          </FormHelperText>
        </FormControl>
      </Stack>
    </form>
  )
}
