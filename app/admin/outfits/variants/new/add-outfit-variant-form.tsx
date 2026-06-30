'use client'

import { useActionState, useEffect, useState } from 'react'
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
import { OutfitCategory, OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import RarityToggle from '@/components/filter/rarity-toggle'
import { useFormConfig } from '@/app/admin/form-context'
import { addOutfitVariant } from '../actions'
import { navLinksData } from '@/lib/nav-links'
import { MENU_PROPS } from '@/lib/types/props'
import { toSlug } from '@/lib/utils'

const FORM_ID = 'add-outfit-variant'

export default function AddOutfitVariantForm({
  outfitSets,
  outfitCategories,
  seasons,
  seasonCategories,
  styles,
  labels,
}: {
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  styles: Style[]
  labels: Label[]
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState('')
  const [outfitCategory, setOutfitCategory] = useState('')
  const [season, setSeason] = useState('')
  const [seasonCategory, setSeasonCategory] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [labelSelect, setLabelSelect] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  useEffect(() => {
    if (!editSlug) {
      if (outfitSet) {
        const parts = [outfitSet, outfitCategory].filter(Boolean)
        setSlug(parts.length > 0 ? parts.join('-') : '')
      } else {
        const parts = [toSlug(title), outfitCategory].filter(Boolean)
        setSlug(parts.length > 0 ? parts.join('-') : '')
      }
    }
  }, [outfitSet, outfitCategory, title, editSlug])

  useEffect(() => {
    const set = outfitSets.find((s) => s.slug === outfitSet)
    if (set) {
      if (typeof set.rarity === 'number') setRarity(set.rarity)
      setStyle(set.style ?? '')
      setLabelSelect([set.label, set.label_2].filter(Boolean) as string[])
    } else {
      setRarity('')
      setStyle('')
      setLabelSelect([])
    }
  }, [outfitSet]) // eslint-disable-line react-hooks/exhaustive-deps

  const [state, action, pending] = useActionState(addOutfitVariant, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.variants.list,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setOutfitSet('')
      setOutfitCategory('')
      setSeason('')
      setSeasonCategory('')
      setRarity('')
      setStyle('')
      setLabelSelect([])
      setTitle('')
      setDescription('')
      setIsDefault(false)
      setSlug('')
      setEditSlug(false)
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
          required={!outfitSet}
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
          helperText={
            outfitSet
              ? 'Auto-generated from outfit set and category — edit if needed'
              : 'Auto-generated from title and category — edit if needed'
          }
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
