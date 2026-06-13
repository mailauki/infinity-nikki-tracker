'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { toSlug, toTitle } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import {
  Ability,
  CarouselImage,
  EvolutionDraft,
  OutfitCategory,
  OutfitSetRaw,
} from '@/lib/types/outfit'
import { Tables } from '@/lib/types/supabase'
import { Label, Style } from '@/lib/types/eureka'

type OutfitVariantRow = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'outfit_category'
  | 'evolution'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
  | 'updated_at'
>
import ImageUpload from '@/components/forms/image-upload'
import CarouselImageUpload from '@/components/forms/carousel-image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { editOutfitSet } from '../../actions'
import EvolutionEditor from '../../evolution-editor'
import RarityToggle from '@/components/filter/rarity-toggle'
import { DRESS_SLUGS, SEPARATES_SLUGS } from '@/components/filter/outfit-category-select'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-outfit-set'

export default function EditOutfitSetForm({
  outfitSet,
  styles,
  labels,
  abilities,
  outfitCategories,
  initialDrafts = [],
  initialGlowupEvolutionOrder = '',
  initialCategorySelect = [],
  initialVariants = [],
  initialCarouselImages = [],
  initialEvolutionCarouselImages = {},
  back,
}: {
  outfitSet: OutfitSetRaw
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  outfitCategories: OutfitCategory[]
  initialDrafts?: EvolutionDraft[]
  initialGlowupEvolutionOrder?: number | ''
  initialCategorySelect?: string[]
  initialVariants?: OutfitVariantRow[]
  initialCarouselImages?: CarouselImage[]
  initialEvolutionCarouselImages?: Record<string, CarouselImage[]>
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(outfitSet.title)
  const [slug, setSlug] = useState(outfitSet.slug ?? toSlug(outfitSet.title))
  const [rarity, setRarity] = useState<number | ''>(outfitSet.rarity ?? '')
  const [description, setDescription] = useState(outfitSet.description ?? '')
  const [style, setStyle] = useState(outfitSet.style ?? '')
  const [labelSelect, setLabelSelect] = useState<string[]>(
    [outfitSet.label, outfitSet.label_2].filter(Boolean) as string[]
  )
  const [ability, setAbility] = useState(outfitSet.ability ?? '')
  const [editSlug, setEditSlug] = useState(false)
  const [evolutionDrafts, setEvolutionDrafts] = useState<EvolutionDraft[]>(initialDrafts)
  const [glowupEvolutionOrder, setGlowupEvolutionOrder] = useState<number | ''>(
    initialGlowupEvolutionOrder
  )
  const [categorySelect, setCategorySelect] = useState<string[]>(initialCategorySelect)
  const [setImage, setSetImage] = useState<string | null>(outfitSet.image_url ?? null)
  const [altSetImage, setAltSetImage] = useState<string | null>(outfitSet.alt_image_url ?? null)
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(initialCarouselImages)
  const [evolutionCarouselImages, setEvolutionCarouselImages] = useState<
    Record<string, CarouselImage[]>
  >(initialEvolutionCarouselImages)
  // Base variants use the {set_slug}-base evolution slug (never null) after migration.
  const baseEvoSlug = `${outfitSet.slug}-base`
  const isBaseVariant = (v: OutfitVariantRow) => v.evolution === baseEvoSlug || v.default === true
  const [variantRows, setVariantRows] = useState<OutfitVariantRow[]>(
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

  function handleCategoryChange(e: SelectChangeEvent<string[]>) {
    const { value } = e.target
    const next = typeof value === 'string' ? value.split(',') : value
    const addedSlug = next.find((s) => !categorySelect.includes(s))
    if (addedSlug && DRESS_SLUGS.includes(addedSlug)) {
      setCategorySelect(next.filter((s) => !SEPARATES_SLUGS.includes(s)))
    } else if (addedSlug && SEPARATES_SLUGS.includes(addedSlug)) {
      setCategorySelect(next.filter((s) => !DRESS_SLUGS.includes(s)))
    } else {
      setCategorySelect(next)
    }
  }

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  const boundAction = editOutfitSet.bind(null, outfitSet.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: back, pending, showUpdateOnly: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  useEffect(() => {
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })

      if ('variants' in state) {
        const fresh = state.variants.filter(isBaseVariant)
        setVariantRows(fresh)
        setVariantImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
        )
        setVariantAltImages(
          Object.fromEntries(fresh.filter((v) => v.slug).map((v) => [v.slug, v.alt_image_url]))
        )
      }
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
          onChange={(e) => setTitle(e.target.value)}
        />

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Used in the URL — edit with caution"
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

        <input name="rarity" type="hidden" value={rarity} />
        <RarityToggle
          selectedRarity={typeof rarity === 'number' ? rarity : null}
          onRarityChange={(_e, value) => setRarity(value ?? '')}
        />

        <FormControl>
          <Typography component={FormLabel} id="style-buttons-group-label" variant="overline">
            Style
          </Typography>
          <input name="style" type="hidden" value={style} />
          <ToggleButtonGroup
            exclusive
            aria-labelledby="style-buttons-group-label"
            value={style || null}
            onChange={(_, value) => setStyle(value ?? '')}
          >
            {styles.map((s) => (
              <ToggleButton key={s.slug} sx={{ py: 1.25 }} value={s.slug}>
                {s.title}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FormControl>

        <input name="label" type="hidden" value={labelSelect[0] ?? ''} />
        <input name="label_2" type="hidden" value={labelSelect[1] ?? ''} />
        <FormControl>
          <InputLabel>Labels</InputLabel>
          <Select
            multiple
            MenuProps={MENU_PROPS}
            input={<OutlinedInput label="Labels" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((s) => {
                  const lbl = labels.find((l) => l.slug === s)
                  return <Chip key={s} label={lbl?.title ?? s} size="small" />
                })}
              </Box>
            )}
            value={labelSelect}
            onChange={(e) => {
              const { value } = e.target
              const next = typeof value === 'string' ? value.split(',') : value
              if (next.length <= 2) setLabelSelect(next)
            }}
          >
            {labels.map((l) => {
              const selected = labelSelect.includes(l.slug)
              return (
                <MenuItem
                  key={l.slug}
                  disabled={!selected && labelSelect.length >= 2}
                  value={l.slug}
                >
                  {selected ? (
                    <CheckBox fontSize="small" sx={{ mr: 1 }} />
                  ) : (
                    <CheckBoxOutlineBlank fontSize="small" sx={{ mr: 1 }} />
                  )}
                  {l.title}
                </MenuItem>
              )
            })}
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
          <InputLabel>Ability</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Ability"
            name="ability"
            value={ability}
            onChange={(e) => setAbility(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {abilities.map((a) => (
              <MenuItem key={a.slug} value={a.slug}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Categories</InputLabel>
          <Select
            multiple
            MenuProps={MENU_PROPS}
            input={<OutlinedInput label="Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((s) => {
                  const cat = outfitCategories.find((c) => c.slug === s)
                  return <Chip key={s} label={cat?.title ?? s} size="small" />
                })}
              </Box>
            )}
            value={categorySelect}
            onChange={handleCategoryChange}
          >
            {Object.entries(
              outfitCategories.reduce<Record<string, typeof outfitCategories>>(
                (groups, cat) => ({ ...groups, [cat.part]: [...(groups[cat.part] ?? []), cat] }),
                {}
              )
            ).flatMap(([part, cats]) => [
              <ListSubheader key={part} sx={{ textTransform: 'capitalize' }}>
                {part}
              </ListSubheader>,
              ...cats.map((c) => {
                const selected = categorySelect.includes(c.slug)
                const conflicting =
                  (DRESS_SLUGS.includes(c.slug) &&
                    categorySelect.some((s) => SEPARATES_SLUGS.includes(s))) ||
                  (SEPARATES_SLUGS.includes(c.slug) &&
                    categorySelect.some((s) => DRESS_SLUGS.includes(s)))
                return (
                  <MenuItem key={c.slug} disabled={!selected && conflicting} value={c.slug}>
                    {selected ? (
                      <CheckBox fontSize="small" sx={{ mr: 1 }} />
                    ) : (
                      <CheckBoxOutlineBlank fontSize="small" sx={{ mr: 1 }} />
                    )}
                    {c.title}
                  </MenuItem>
                )
              }),
            ])}
          </Select>
        </FormControl>

        <EvolutionEditor
          glowupEvolutionOrder={glowupEvolutionOrder}
          initialDrafts={initialDrafts}
          maxEvolutions={maxEvolutions}
          onChange={setEvolutionDrafts}
          onGlowupChange={setGlowupEvolutionOrder}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Set Images</Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <ImageUpload
              caption="Default"
              size="lg"
              slug={outfitSet.slug}
              table="outfit_sets"
              url={setImage}
              onUpload={(url) => setSetImage(url)}
            />
            <ImageUpload
              caption="Alternative"
              column="alt_image_url"
              size="lg"
              slug={outfitSet.slug}
              table="outfit_sets"
              url={altSetImage}
              onUpload={(url) => setAltSetImage(url)}
            />
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Gallery Images</Typography>
          <CarouselImageUpload
            foreignKeyField="outfit_set"
            images={carouselImages}
            slug={outfitSet.slug ?? ''}
            table="outfit_set_carousel_images"
            onChange={setCarouselImages}
          />
        </Stack>

        {evolutionDrafts.some((d) => d.existingSlug) && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Evolution Gallery Images</Typography>
            {evolutionDrafts
              .filter((d) => d.existingSlug)
              .map((d) => (
                <Stack key={d.existingSlug} spacing={0.5}>
                  <Typography color="textSecondary" variant="caption">
                    {d.subtitle || `Evolution ${d.order}`}
                  </Typography>
                  <CarouselImageUpload
                    foreignKeyField="evolution"
                    images={evolutionCarouselImages[d.existingSlug!] ?? []}
                    slug={d.existingSlug!}
                    table="evolution_carousel_images"
                    onChange={(imgs) =>
                      setEvolutionCarouselImages((prev) => ({
                        ...prev,
                        [d.existingSlug!]: imgs,
                      }))
                    }
                  />
                </Stack>
              ))}
          </Stack>
        )}

        {variantRows.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {variantRows
                .filter((v) => v.slug)
                .map((v) => (
                  <Stack
                    key={v.slug}
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: 'space-between' }}
                  >
                    <input
                      name={`variant_image_${v.slug}`}
                      type="hidden"
                      value={variantImages[v.slug!] ?? ''}
                    />
                    <ImageUpload
                      caption={(v.outfit_category && toTitle(v.outfit_category)) ?? undefined}
                      slug={v.slug ?? undefined}
                      table="outfit_variants"
                      url={variantImages[v.slug!] ?? null}
                      onUpload={(url) => setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))}
                    />
                    <ImageUpload
                      caption={
                        (v.outfit_category && `Alt ${toTitle(v.outfit_category)}`) ?? undefined
                      }
                      column="alt_image_url"
                      slug={v.slug ?? undefined}
                      table="outfit_variants"
                      url={variantAltImages[v.slug!] ?? null}
                      onUpload={(url) =>
                        setVariantAltImages((prev) => ({ ...prev, [v.slug!]: url }))
                      }
                    />
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}

        <input name="evolution_drafts" type="hidden" value={JSON.stringify(evolutionDrafts)} />
        <input name="glowup_evolution_order" type="hidden" value={glowupEvolutionOrder} />
        <input
          name="outfit_categories"
          type="hidden"
          value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
        />
      </Stack>
    </form>
  )
}
