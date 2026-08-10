'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Style } from '@/lib/types/eureka'
import { MakeupCategory, MakeupSetRaw } from '@/lib/types/makeup'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import { useFormConfig } from '@/app/admin/form-context'
import { addMakeupSet } from '../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'add-makeup-set'

export default function AddMakeupSetForm({
  makeupSets,
  outfitSets,
  styles,
  seasons,
  seasonCategories,
  makeupCategories,
}: {
  makeupSets: MakeupSetRaw[]
  outfitSets: OutfitSetRaw[]
  styles: Style[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  makeupCategories: MakeupCategory[]
}) {
  const { setFormConfig, clearFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [season, setSeason] = useState('')
  const [seasonCategory, setSeasonCategory] = useState('')
  const [outfitSet, setOutfitSet] = useState<string | null>(null)
  const [baseSet, setBaseSet] = useState<string | null>(null)
  const [order, setOrder] = useState<number | ''>(1)
  const [slugEdited, setSlugEdited] = useState(false)

  // Every makeup set always has all of the categories — there is nothing to
  // choose, so the categories are derived rather than held in state. Only
  // variants that aren't tied to a set differ, and those are managed on the
  // makeup variants pages.
  const categorySlugs = makeupCategories.map((c) => c.slug)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugEdited) setSlug(toSlug(value))
  }

  function handleBaseSetChange(value: string | null) {
    setBaseSet(value)
    setOrder(value ? 2 : 1)
  }

  const selectedOutfitSet = outfitSets.find((s) => s.slug === outfitSet) ?? null
  const selectedBaseSet = makeupSets.find((s) => s.slug === baseSet) ?? null

  const [state, action, pending] = useActionState(addMakeupSet, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      pending,
      showAddAnother: true,
    })
    // Clearing on unmount is what makes this correct: the toolbar renders in a
    // portal outside the <form> and targets it by id, so a formId left over from
    // a previous form points at an element no longer in the DOM and Save silently
    // no-ops. Do not rely on the next form overwriting it — on a form -> form
    // navigation (e.g. "Update & next item") mount order is not guaranteed.
    return () => clearFormConfig(FORM_ID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setTitle('')
      setSlug('')
      setDescription('')
      setRarity('')
      setStyle('')
      setSeason('')
      setSeasonCategory('')
      setOutfitSet(null)
      setBaseSet(null)
      setOrder(1)
      setSlugEdited(false)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField
          required
          label="Title"
          name="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <SlugField
          required
          helperText="Auto-generated from name — edit if needed"
          value={slug}
          onChange={setSlug}
          onUserEdit={() => setSlugEdited(true)}
        />

        <RarityField value={rarity} onChange={setRarity} />

        <ToggleField
          label="Style"
          name="style"
          options={styles}
          value={style}
          onChange={setStyle}
        />

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

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

        <input name="outfit_set" type="hidden" value={outfitSet ?? ''} />
        {/* Titles are deliberately non-unique (evolution subtitles repeat across
            sets, e.g. two "Rainbow" rows), so key the option on the slug —
            MUI's default key is the label, which collides and warns. */}
        <Autocomplete
          clearOnEscape
          getOptionLabel={(option) => option.title ?? option.slug ?? ''}
          isOptionEqualToValue={(option, val) => option.slug === val.slug}
          options={outfitSets}
          renderInput={(params) => <TextField {...params} label="Associated Outfit" />}
          renderOption={(props, option) => {
            // Drop MUI's label-derived key in favour of the unique slug.
            const { key, ...optionProps } = props
            void key
            return (
              <li {...optionProps} key={option.slug}>
                {option.title ?? option.slug}
              </li>
            )
          }}
          value={selectedOutfitSet}
          onChange={(_e, newValue) => setOutfitSet(newValue?.slug ?? null)}
        />

        <input name="base_set" type="hidden" value={baseSet ?? ''} />
        <Autocomplete
          clearOnEscape
          getOptionLabel={(option) => option.title ?? option.slug ?? ''}
          isOptionEqualToValue={(option, val) => option.slug === val.slug}
          options={makeupSets}
          renderInput={(params) => <TextField {...params} label="Evolution of" />}
          renderOption={(props, option) => {
            // Drop MUI's label-derived key in favour of the unique slug.
            const { key, ...optionProps } = props
            void key
            return (
              <li {...optionProps} key={option.slug}>
                {option.title ?? option.slug}
              </li>
            )
          }}
          value={selectedBaseSet}
          onChange={(_e, newValue) => handleBaseSetChange(newValue?.slug ?? null)}
        />

        {baseSet && (
          <Box sx={{ maxWidth: 160 }}>
            <TextField
              fullWidth
              required
              label="Order"
              name="order"
              slotProps={{ htmlInput: { min: 2 } }}
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            />
          </Box>
        )}
        {!baseSet && <input name="order" type="hidden" value={1} />}

        <Stack spacing={1}>
          <Typography variant="subtitle2">Categories</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {makeupCategories.map((c) => (
              <Chip key={c.slug} label={c.title ?? c.slug} size="small" />
            ))}
          </Box>
          <Typography color="text.secondary" variant="caption">
            Every makeup set gets a variant for all categories.
          </Typography>
        </Stack>

        <Alert severity="info">
          Images can be added after saving — use the makeup set edit form.
        </Alert>

        <input
          name="makeup_categories"
          type="hidden"
          value={JSON.stringify(categorySlugs.map((s) => ({ slug: s })))}
        />
      </Stack>
    </form>
  )
}
