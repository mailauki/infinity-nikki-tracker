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
import { Ability, Evolution, OutfitCategory, OutfitSetRaw } from '@/lib/types/outfit'
import { Tables } from '@/lib/types/supabase'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editOutfitSet } from '../../actions'

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
  evolutions,
  outfitCategories,
  initialEvolutions,
  initialDefaultEvolution = '',
  initialVariants = [],
  back,
}: {
  outfitSet: OutfitSetRaw
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  evolutions: Evolution[]
  outfitCategories: OutfitCategory[]
  initialEvolutions: string[]
  initialDefaultEvolution?: string
  initialVariants?: OutfitVariantRow[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(outfitSet.title)
  const [slug, setSlug] = useState(outfitSet.slug ?? toSlug(outfitSet.title))
  const [rarity, setRarity] = useState<number | ''>(outfitSet.rarity ?? '')
  const [description, setDescription] = useState(outfitSet.description ?? '')
  const [style, setStyle] = useState(outfitSet.style ?? '')
  const [label, setLabel] = useState(outfitSet.label ?? '')
  const [ability, setAbility] = useState(outfitSet.ability ?? '')
  const [editSlug, setEditSlug] = useState(false)
  const [evolutionSelect, setEvolutionSelect] = useState<string[]>(initialEvolutions)
  const [defaultEvolution, setDefaultEvolution] = useState(initialDefaultEvolution)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(initialVariants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setEvolutionSelect((prev) => (prev.length > maxEvolutions ? prev.slice(0, maxEvolutions) : prev))
  }, [maxEvolutions])

  useEffect(() => {
    if (defaultEvolution && !evolutionSelect.includes(defaultEvolution)) setDefaultEvolution('')
  }, [evolutionSelect, defaultEvolution])

  const handleEvolutionChange = (event: SelectChangeEvent<typeof evolutionSelect>) => {
    const {
      target: { value },
    } = event
    setEvolutionSelect(typeof value === 'string' ? value.split(',') : value)
  }

  const boundAction = editOutfitSet.bind(null, outfitSet.id, initialEvolutions, back)
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

        <FormControl sx={{ m: 1, minWidth: 300 }}>
          <InputLabel>Evolutions</InputLabel>
          <Select
            multiple
            input={<OutlinedInput label="Evolutions" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((slug) => {
                  const evo = evolutions.find((e) => e.slug === slug)
                  return <Chip key={slug} label={evo?.title ?? slug} size="small" />
                })}
              </Box>
            )}
            value={evolutionSelect}
            onChange={handleEvolutionChange}
          >
            {evolutions.map((e) => {
              const selected = evolutionSelect.includes(e.slug)
              const SelectionIcon = selected ? CheckBox : CheckBoxOutlineBlank
              return (
                <MenuItem
                  key={e.slug}
                  disabled={evolutionSelect.length >= maxEvolutions && !selected}
                  value={e.slug}
                >
                  <SelectionIcon
                    fontSize="small"
                    style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                  />
                  {e.title}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <FormControl disabled={evolutionSelect.length === 0}>
          <InputLabel>Default Evolution</InputLabel>
          <Select
            input={<OutlinedInput label="Default Evolution" />}
            value={defaultEvolution}
            onChange={(e) => setDefaultEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutionSelect.map((slug) => {
              const evo = evolutions.find((e) => e.slug === slug)
              return (
                <MenuItem key={slug} value={slug}>
                  {evo?.title ?? slug}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

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

        <input name="evolution_select" type="hidden" value={JSON.stringify(evolutionSelect)} />
        <input name="default_evolution" type="hidden" value={defaultEvolution} />
        <input name="outfit_categories" type="hidden" value={JSON.stringify(outfitCategories)} />
      </Stack>
    </form>
  )
}
