'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
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
import { Edit, EditOff } from '@mui/icons-material'
import { OutfitCategory, OutfitSetRaw, OutfitVariantRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/admin/form-context'
import { editOutfitVariant } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'
import ImageUpload from '@/components/forms/image-upload'

const FORM_ID = 'edit-outfit-variant'

export default function EditOutfitVariantForm({
  variant,
  outfitSets,
  outfitCategories,
  seasons,
  seasonCategories,
  back,
}: {
  variant: OutfitVariantRaw
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState(variant.outfit_set ?? '')
  const [outfitCategory, setOutfitCategory] = useState(variant.outfit_category ?? '')
  const [season, setSeason] = useState(variant.seasons ?? '')
  const [seasonCategory, setSeasonCategory] = useState(variant.season_category ?? '')
  const [title, setTitle] = useState(variant.title ?? '')
  const [description, setDescription] = useState(variant.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [slug, setSlug] = useState(variant.slug)
  const [editSlug, setEditSlug] = useState(false)

  const boundAction = editOutfitVariant.bind(null, variant.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back,
      pending,
      showUpdateOnly: true,
      showUpdateNext: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  useEffect(() => {
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl>
          <InputLabel>Outfit Set</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">— None (standalone piece) —</MenuItem>
            {outfitSets
              .filter((s) => s.base_set === null)
              .map((set) => (
                <MenuItem key={set.id} value={set.slug ?? ''}>
                  {set.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Category"
            name="outfit_category"
            value={outfitCategory}
            onChange={(e) => setOutfitCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitCategories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Season</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Season"
            name="seasons"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {seasons.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Season Category</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Season Category"
            name="season_category"
            value={seasonCategory}
            onChange={(e) => setSeasonCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {seasonCategories.map((sc) => (
              <MenuItem key={sc.slug} value={sc.slug}>
                {sc.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Description"
          multiline
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Slug — edit with care, changing it breaks existing image links"
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

        <ImageUpload
          slug={slug || undefined}
          table="outfit_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />

        <input name="default" type="hidden" value={String(isDefault)} />
        <FormControlLabel
          control={
            <Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          }
          label="Default variant"
        />
      </Stack>
    </form>
  )
}
