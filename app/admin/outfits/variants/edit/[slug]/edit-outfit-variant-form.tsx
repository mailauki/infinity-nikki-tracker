'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { OutfitCategory, OutfitSetRaw, OutfitVariantRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import RarityToggle from '@/components/filter/rarity-toggle'
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
  styles,
  labels,
  back,
}: {
  variant: OutfitVariantRaw
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  styles: Style[]
  labels: Label[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState(variant.outfit_set ?? '')
  const [outfitCategory, setOutfitCategory] = useState(variant.outfit_category ?? '')
  const [season, setSeason] = useState(variant.seasons ?? '')
  const [seasonCategory, setSeasonCategory] = useState(variant.season_category ?? '')
  const [rarity, setRarity] = useState<number | ''>(variant.rarity ?? '')
  const [style, setStyle] = useState(variant.style ?? '')
  const [labelSelect, setLabelSelect] = useState<string[]>(
    [variant.label, variant.label_2].filter(Boolean) as string[]
  )
  const [title, setTitle] = useState(variant.title ?? '')
  const [description, setDescription] = useState(variant.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [slug, setSlug] = useState(variant.slug)
  const [editSlug, setEditSlug] = useState(false)

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const set = outfitSets.find((s) => s.slug === outfitSet)
    if (set) {
      if (typeof set.rarity === 'number') setRarity(set.rarity)
      setStyle(set.style ?? '')
      setLabelSelect([set.label, set.label_2].filter(Boolean) as string[])
    }
  }, [outfitSet]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <InputLabel shrink>Outfit Set</InputLabel>
          <Select
            displayEmpty
            MenuProps={MENU_PROPS}
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">— Standalone piece —</MenuItem>
            {(() => {
              const baseSets = outfitSets
                .filter((s) => s.base_set === null)
                .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
              const evosByBase = outfitSets
                .filter((s) => s.base_set !== null)
                .reduce<Record<string, typeof outfitSets>>((acc, s) => {
                  const key = s.base_set!
                  acc[key] = acc[key] ?? []
                  acc[key].push(s)
                  return acc
                }, {})
              return baseSets.flatMap((base) => {
                const evos = (evosByBase[base.slug ?? ''] ?? []).sort(
                  (a, b) => (a.order ?? 0) - (b.order ?? 0)
                )
                if (evos.length === 0) {
                  return [
                    <MenuItem key={base.slug} value={base.slug ?? ''}>
                      {base.title}
                    </MenuItem>,
                  ]
                }
                return [
                  <ListSubheader key={`header-${base.slug}`}>{base.title}</ListSubheader>,
                  <MenuItem key={base.slug} sx={{ pl: 3 }} value={base.slug ?? ''}>
                    {base.title}
                  </MenuItem>,
                  ...evos.map((evo) => (
                    <MenuItem key={evo.slug} sx={{ pl: 3 }} value={evo.slug ?? ''}>
                      {evo.title}
                    </MenuItem>
                  )),
                ]
              })
            })()}
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

        <input name="rarity" type="hidden" value={rarity} />
        <RarityToggle
          selectedRarity={typeof rarity === 'number' ? rarity : null}
          onRarityChange={(_e, value) => setRarity(value ?? '')}
        />

        <FormControl>
          <Typography component={FormLabel} id="variant-style-label" variant="overline">
            Style
          </Typography>
          <input name="style" type="hidden" value={style} />
          <ToggleButtonGroup
            exclusive
            aria-labelledby="variant-style-label"
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
