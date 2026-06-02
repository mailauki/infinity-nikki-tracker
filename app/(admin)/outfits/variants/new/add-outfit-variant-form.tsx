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
  ListSubheader,
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
import { addOutfitVariant } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-outfit-variant'

export default function AddOutfitVariantForm({
  outfitSets,
  outfitCategories,
  evolutions,
  variants,
}: {
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
  variants: OutfitVariantRaw[]
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState('')
  const [outfitCategory, setOutfitCategory] = useState('')
  const [evolution, setEvolution] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) => v.outfit_set === outfitSet && v.outfit_category === outfitCategory && v.default
  )

  useEffect(() => {
    if (!editSlug && outfitSet && outfitCategory && evolution) {
      setSlug(toSlugVariant(outfitSet, outfitCategory, evolution))
    }
  }, [outfitSet, outfitCategory, evolution, editSlug])

  const [state, action, pending] = useActionState(addOutfitVariant, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.dashboard.outfits.variants.add.replace('/new', ''),
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  const groupedCategories = outfitCategories.reduce<Record<string, OutfitCategory[]>>(
    (groups, cat) => {
      const type = cat.type ?? 'Other'
      ;(groups[type] ??= []).push(cat)
      return groups
    },
    {}
  )

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
            {Object.entries(groupedCategories).flatMap(([type, cats]) => [
              <ListSubheader key={type}>{type}</ListSubheader>,
              ...cats.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.part}
                </MenuItem>
              )),
            ])}
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

        <input name="slug" type="hidden" value={slug} />
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
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          slug={slug || undefined}
          table="outfit_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />

        <input name="default" type="hidden" value={String(isDefault)} />
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
