'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { MakeupCategory, MakeupSetRaw } from '@/lib/types/makeup'
import { Tables } from '@/lib/types/supabase'
import ImageUploadPair from '@/components/forms/image-upload-pair'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import { useFormConfig } from '@/app/admin/form-context'
import { updateMakeupSet } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'
import MakeupVariantImageCard from './makeup-variant-image-card'

type MakeupVariantRow = Pick<
  Tables<'makeup_variants'>,
  | 'id'
  | 'slug'
  | 'makeup_set'
  | 'makeup_category'
  | 'image_url'
  | 'alt_image_url'
  | 'title'
  | 'description'
>

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
  initialVariants = [],
}: {
  initial: MakeupSetRaw
  makeupSets: MakeupSetRaw[]
  outfitSets: OutfitSetRaw[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  makeupCategories: MakeupCategory[]
  initialVariants?: MakeupVariantRow[]
}) {
  const { setFormConfig, clearFormConfig } = useFormConfig()
  const router = useRouter()
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
  // Only the base set's variants get cards — evolutions are edited on their own pages.
  const baseSlug = initial.slug ?? ''
  const isBaseVariant = (v: MakeupVariantRow) => v.makeup_set === baseSlug
  const [variantRows, setVariantRows] = useState<MakeupVariantRow[]>(
    initialVariants.filter(isBaseVariant)
  )
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(
      initialVariants.filter((v) => v.slug && isBaseVariant(v)).map((v) => [v.slug, v.image_url])
    )
  )
  const [variantAltImages, setVariantAltImages] = useState<Record<string, string | null>>(
    Object.fromEntries(
      initialVariants
        .filter((v) => v.slug && isBaseVariant(v))
        .map((v) => [v.slug, v.alt_image_url])
    )
  )
  const [variantTitles, setVariantTitles] = useState<Record<string, string>>(
    Object.fromEntries(
      initialVariants.filter((v) => v.slug && isBaseVariant(v)).map((v) => [v.slug, v.title ?? ''])
    )
  )
  const [variantDescriptions, setVariantDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(
      initialVariants
        .filter((v) => v.slug && isBaseVariant(v))
        .map((v) => [v.slug, v.description ?? ''])
    )
  )

  // A set cannot be its own base — exclude the row being edited from options.
  const baseSetOptions = makeupSets.filter((s) => s.slug !== initial.slug)

  // Every makeup set always has all of the categories, so this is submitted as
  // the full list rather than an editable selection. Sets created before that
  // rule get their missing variants back-filled on the next save; only variants
  // not tied to a set differ, and those live on the makeup variants pages.
  const categorySlugs = makeupCategories.map((c) => c.slug)

  function handleBaseSetChange(value: string | null) {
    setBaseSet(value)
    setOrder(value ? 2 : 1)
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
        return
      }

      if ('variants' in state && state.variants) {
        const fresh = state.variants.filter(isBaseVariant)
        setVariantRows(fresh)
        setVariantImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
        )
        setVariantAltImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.alt_image_url]))
        )
        setVariantTitles(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.title ?? '']))
        )
        setVariantDescriptions(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.description ?? '']))
        )
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
          options={baseSetOptions}
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
            Every makeup set has a variant for all categories.
          </Typography>
        </Stack>

        <input
          name="makeup_categories"
          type="hidden"
          value={JSON.stringify(categorySlugs.map((s) => ({ slug: s })))}
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

        {variantRows.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {[...variantRows]
                .sort((a, b) => {
                  const aIndex = makeupCategories.findIndex((c) => c.slug === a.makeup_category)
                  const bIndex = makeupCategories.findIndex((c) => c.slug === b.makeup_category)
                  return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
                })
                .filter((v) => v.slug)
                .map((v) => (
                  <MakeupVariantImageCard
                    key={v.id}
                    altImage={variantAltImages[v.slug!] ?? null}
                    description={variantDescriptions[v.slug!] ?? ''}
                    image={variantImages[v.slug!] ?? null}
                    title={variantTitles[v.slug!] ?? ''}
                    variant={v}
                    onAltImageChange={(url) =>
                      setVariantAltImages((prev) => ({ ...prev, [v.slug!]: url }))
                    }
                    onDescriptionChange={(value) =>
                      setVariantDescriptions((prev) => ({ ...prev, [v.slug!]: value }))
                    }
                    onImageChange={(url) =>
                      setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                    }
                    onTitleChange={(value) =>
                      setVariantTitles((prev) => ({ ...prev, [v.slug!]: value }))
                    }
                  />
                ))}
            </Box>
          </Stack>
        )}
      </Stack>
    </form>
  )
}
