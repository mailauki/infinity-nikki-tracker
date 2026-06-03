'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  FormControl,
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
  Typography,
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { Ability, EvolutionDraft, OutfitCategory, OutfitSetRaw } from '@/lib/types/outfit'
import { Tables } from '@/lib/types/supabase'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editOutfitSet } from '../../actions'
import EvolutionEditor from '../../evolution-editor'

type OutfitVariantRow = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'image_url'
  | 'default'
  | 'updated_at'
>

const FORM_ID = 'edit-outfit-set'

export default function EditOutfitSetForm({
  outfitSet,
  styles,
  labels,
  abilities,
  outfitCategories,
  initialDrafts = [],
  initialDefaultEvolutionOrder = '',
  initialCategorySelect = [],
  initialVariants = [],
  initialEvolutionImages = {},
  back,
}: {
  outfitSet: OutfitSetRaw
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  outfitCategories: OutfitCategory[]
  initialDrafts?: EvolutionDraft[]
  initialDefaultEvolutionOrder?: number | ''
  initialCategorySelect?: string[]
  initialVariants?: OutfitVariantRow[]
  initialEvolutionImages?: Record<string, string | null>
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(outfitSet.title)
  const [slug, setSlug] = useState(outfitSet.slug ?? toSlug(outfitSet.title))
  const [rarity, setRarity] = useState<number | ''>(outfitSet.rarity ?? '')
  const [description, setDescription] = useState(outfitSet.description ?? '')
  const [style, setStyle] = useState(outfitSet.style ?? '')
  const [label, setLabel] = useState(outfitSet.label ?? '')
  const [label2, setLabel2] = useState(outfitSet.label_2 ?? '')
  const [ability, setAbility] = useState(outfitSet.ability ?? '')
  const [editSlug, setEditSlug] = useState(false)
  const [evolutionDrafts, setEvolutionDrafts] = useState<EvolutionDraft[]>(initialDrafts)
  const [defaultEvolutionOrder, setDefaultEvolutionOrder] = useState<number | ''>(
    initialDefaultEvolutionOrder
  )
  const [categorySelect, setCategorySelect] = useState<string[]>(initialCategorySelect)
  const [setImage, setSetImage] = useState<string | null>(outfitSet.image_url ?? null)
  const [evolutionImages, setEvolutionImages] =
    useState<Record<string, string | null>>(initialEvolutionImages)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(initialVariants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )

  function handleCategoryChange(e: SelectChangeEvent<string[]>) {
    const { value } = e.target
    setCategorySelect(typeof value === 'string' ? value.split(',') : value)
  }

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  const boundAction = editOutfitSet.bind(null, outfitSet.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: back, pending })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl>
          <InputLabel>Rarity</InputLabel>
          <Select
            label="Rarity"
            name="rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {[2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
                <SparkleIcon
                  color="inherit"
                  fontSize="inherit"
                  sx={{ rotate: '15deg', ml: 0.5, mt: -0.3 }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Style</InputLabel>
          <Select
            label="Style"
            name="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {styles.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Label</InputLabel>
          <Select
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

        <FormControl>
          <InputLabel>Label 2</InputLabel>
          <Select
            label="Label 2"
            name="label_2"
            value={label2}
            onChange={(e) => setLabel2(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {labels
              .filter((l) => l.slug !== label)
              .map((l) => (
                <MenuItem key={l.slug} value={l.slug}>
                  {l.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Ability</InputLabel>
          <Select
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
              }),
            ])}
          </Select>
        </FormControl>

        <EvolutionEditor
          defaultEvolutionOrder={defaultEvolutionOrder}
          initialDrafts={initialDrafts}
          maxEvolutions={maxEvolutions}
          onChange={setEvolutionDrafts}
          onDefaultChange={setDefaultEvolutionOrder}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Set Image</Typography>
          <ImageUpload
            slug={outfitSet.slug}
            table="outfit_sets"
            url={setImage}
            onUpload={(url) => setSetImage(url)}
          />
        </Stack>

        {initialDrafts.filter((d) => d.existingSlug).length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Evolution Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {initialDrafts
                .filter((d) => d.existingSlug)
                .map((d) => (
                  <Stack key={d.existingSlug} spacing={0.5}>
                    <Typography sx={{ fontFamily: 'monospace' }} variant="caption">
                      {d.existingSlug}
                    </Typography>
                    <ImageUpload
                      caption={d.subtitle}
                      slug={d.existingSlug}
                      table="evolutions"
                      url={evolutionImages[d.existingSlug!] ?? null}
                      onUpload={(url) =>
                        setEvolutionImages((prev) => ({ ...prev, [d.existingSlug!]: url }))
                      }
                    />
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}

        {initialVariants.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              {initialVariants
                .filter((v) => v.slug)
                .map((v) => (
                  <Stack key={v.slug} spacing={0.5}>
                    <Typography sx={{ fontFamily: 'monospace' }} variant="caption">
                      {v.slug}
                    </Typography>
                    <input
                      name={`variant_image_${v.slug}`}
                      type="hidden"
                      value={variantImages[v.slug!] ?? ''}
                    />
                    <ImageUpload
                      slug={v.slug ?? undefined}
                      table="outfit_variants"
                      url={variantImages[v.slug!] ?? null}
                      onUpload={(url) =>
                        setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                      }
                    />
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}

        <input
          name="evolution_drafts"
          type="hidden"
          value={JSON.stringify(evolutionDrafts)}
        />
        <input
          name="default_evolution_order"
          type="hidden"
          value={defaultEvolutionOrder}
        />
        <input
          name="outfit_categories"
          type="hidden"
          value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
        />
      </Stack>
    </form>
  )
}
