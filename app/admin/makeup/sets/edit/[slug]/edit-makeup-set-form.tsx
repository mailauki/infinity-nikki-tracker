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
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { MakeupCategory, MakeupSetRaw } from '@/lib/types/makeup'
import ImageUploadPair from '@/components/forms/image-upload-pair'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import { useFormConfig } from '@/app/admin/form-context'
import { updateMakeupSet } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-makeup-set'

export default function EditMakeupSetForm({
  initial,
  makeupSets,
  outfitSets,
  styles,
  labels,
  seasons,
  seasonCategories,
  makeupCategories,
  initialCategorySelect = [],
}: {
  initial: MakeupSetRaw
  makeupSets: MakeupSetRaw[]
  outfitSets: OutfitSetRaw[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  makeupCategories: MakeupCategory[]
  initialCategorySelect?: string[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [rarity, setRarity] = useState<number | ''>(initial.rarity ?? '')
  const [style, setStyle] = useState(initial.style ?? '')
  const [label, setLabel] = useState(initial.label ?? '')
  const [season, setSeason] = useState(initial.seasons ?? '')
  const [seasonCategory, setSeasonCategory] = useState(initial.season_category ?? '')
  const [outfitSet, setOutfitSet] = useState<string | null>(initial.outfit_set ?? null)
  const [baseSet, setBaseSet] = useState<string | null>(initial.base_set ?? null)
  const [order, setOrder] = useState<number | ''>(initial.order ?? 1)
  const [setImage, setSetImage] = useState<string | null>(initial.image_url ?? null)
  const [altSetImage, setAltSetImage] = useState<string | null>(initial.alt_image_url ?? null)
  const [categorySelect, setCategorySelect] = useState<string[]>(initialCategorySelect)

  // A set cannot be its own base — exclude the row being edited from options.
  const baseSetOptions = makeupSets.filter((s) => s.slug !== initial.slug)

  function handleBaseSetChange(value: string | null) {
    setBaseSet(value)
    setOrder(value ? 2 : 1)
  }

  function handleCategoryChange(e: SelectChangeEvent<string[]>) {
    const { value } = e.target
    setCategorySelect(typeof value === 'string' ? value.split(',') : value)
  }

  const selectedOutfitSet = outfitSets.find((s) => s.slug === outfitSet) ?? null
  const selectedBaseSet = baseSetOptions.find((s) => s.slug === baseSet) ?? null

  const [state, action, pending] = useActionState(updateMakeupSet, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      pending,
      showUpdateOnly: true,
      showUpdateNext: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <input name="original_slug" type="hidden" value={initial.slug ?? ''} />

        <TextField
          required
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <SlugField
          required
          helperText="Used in the URL — edit with caution"
          value={slug}
          onChange={setSlug}
        />

        <RarityField value={rarity} onChange={setRarity} />

        <ToggleField
          label="Style"
          name="style"
          options={styles}
          value={style}
          onChange={setStyle}
        />

        <FormControl>
          <InputLabel>Label</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {labels.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
        <Autocomplete
          clearOnEscape
          getOptionLabel={(option) => option.title ?? option.slug ?? ''}
          isOptionEqualToValue={(option, val) => option.slug === val.slug}
          options={outfitSets}
          renderInput={(params) => <TextField {...params} label="Associated Outfit" />}
          value={selectedOutfitSet}
          onChange={(_e, newValue) => setOutfitSet(newValue?.slug ?? null)}
        />

        <input name="base_set" type="hidden" value={baseSet ?? ''} />
        <Autocomplete
          clearOnEscape
          getOptionLabel={(option) => option.title ?? option.slug ?? ''}
          isOptionEqualToValue={(option, val) => option.slug === val.slug}
          options={baseSetOptions}
          renderInput={(params) => <TextField {...params} label="Evolution of" />}
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

        <FormControl>
          <InputLabel>Categories</InputLabel>
          <Select
            multiple
            MenuProps={MENU_PROPS}
            input={<OutlinedInput label="Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((s) => {
                  const cat = makeupCategories.find((c) => c.slug === s)
                  return <Chip key={s} label={cat?.title ?? s} size="small" />
                })}
              </Box>
            )}
            value={categorySelect}
            onChange={handleCategoryChange}
          >
            {makeupCategories.map((c) => {
              const selected = categorySelect.includes(c.slug)
              return (
                <MenuItem key={c.slug} value={c.slug}>
                  {selected ? (
                    <CheckBox fontSize="small" sx={{ mr: 1 }} />
                  ) : (
                    <CheckBoxOutlineBlank fontSize="small" sx={{ mr: 1 }} />
                  )}
                  {c.title}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Alert severity="warning">
          Unchecking a category deletes its variant and any collection records for it.
        </Alert>

        <input
          name="makeup_categories"
          type="hidden"
          value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Set Images</Typography>
          <ImageUploadPair
            altImage={altSetImage}
            image={setImage}
            size="xl"
            slug={initial.slug ?? undefined}
            table="makeup_sets"
            onAltImageChange={setAltSetImage}
            onImageChange={setSetImage}
          />
        </Stack>

        <input name="image_url" type="hidden" value={setImage ?? ''} />
        <input name="alt_image_url" type="hidden" value={altSetImage ?? ''} />
      </Stack>
    </form>
  )
}
