'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { MomoCloakRaw } from '@/lib/types/momo'
import { Location, OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import ImageUploadPair from '@/components/forms/image-upload-pair'
import { useFormConfig } from '@/app/admin/form-context'
import { updateMomoCloak } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-momo-cloak'

export default function EditMomoCloakForm({
  initial,
  styles,
  labels,
  seasons,
  seasonCategories,
  locations,
  outfitSets,
}: {
  initial: MomoCloakRaw
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  locations: Location[]
  outfitSets: OutfitSetRaw[]
}) {
  const { setFormConfig, clearFormConfig } = useFormConfig()
  const router = useRouter()
  const [title, setTitle] = useState(initial.title ?? '')
  const [slug, setSlug] = useState(initial.slug ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [rarity, setRarity] = useState<number | ''>(initial.rarity ?? '')
  const [style, setStyle] = useState(initial.style ?? '')
  const [label, setLabel] = useState(initial.label ?? '')
  const [season, setSeason] = useState(initial.seasons ?? '')
  const [seasonCategory, setSeasonCategory] = useState(initial.season_category ?? '')
  const [location, setLocation] = useState(initial.location ?? '')
  const [outfitSet, setOutfitSet] = useState<string | null>(initial.outfit_set ?? null)
  const [image, setImage] = useState<string | null>(initial.image_url ?? null)
  const [altImage, setAltImage] = useState<string | null>(initial.alt_image_url ?? null)

  const selectedOutfitSet = outfitSets.find((s) => s.slug === outfitSet) ?? null

  const [state, action, pending] = useActionState(updateMomoCloak, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      pending,
      showUpdateOnly: true,
      showUpdateNext: true,
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
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })

      // The action hands back a redirect target instead of calling Next's
      // redirect(); see the NOTE at the top of ../../actions.ts.
      if ('redirectTo' in state && state.redirectTo) {
        router.push(state.redirectTo)
      }
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

        <FormControl>
          <InputLabel>Location</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {locations.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
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

        <ImageUploadPair
          altImage={altImage}
          image={image}
          slug={initial.slug ?? undefined}
          table="momo_cloaks"
          onAltImageChange={setAltImage}
          onImageChange={setImage}
        />
        <input name="image_url" type="hidden" value={image ?? ''} />
        <input name="alt_image_url" type="hidden" value={altImage ?? ''} />
      </Stack>
    </form>
  )
}
