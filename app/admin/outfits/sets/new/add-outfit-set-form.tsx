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
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { Ability, EvolutionDraft, OutfitCategory, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import RarityToggle from '@/components/filter/rarity-toggle'
import { DRESS_SLUGS, SEPARATES_SLUGS } from '@/components/filter/outfit-category-select'
import { useFormConfig } from '@/app/admin/form-context'
import { addOutfitSet } from '../actions'
import { navLinksData } from '@/lib/nav-links'
import EvolutionEditor from '../evolution-editor'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'add-outfit-set'

export default function AddOutfitSetForm({
  styles,
  labels,
  abilities,
  seasons,
  seasonCategories,
  outfitCategories,
}: {
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  outfitCategories: OutfitCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [labelSelect, setLabelSelect] = useState<string[]>([])
  const [ability, setAbility] = useState('')
  const [season, setSeason] = useState('')
  const [seasonCategory, setSeasonCategory] = useState('')
  const [description, setDescription] = useState('')
  const [evolutionDrafts, setEvolutionDrafts] = useState<EvolutionDraft[]>([])
  const [glowupEvolutionOrder, setGlowupEvolutionOrder] = useState<number | ''>('')
  const [categorySelect, setCategorySelect] = useState<string[]>([])
  const [handheldBaseOnly, setHandheldBaseOnly] = useState(false)
  const [editSlug, setEditSlug] = useState(false)

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

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  const [state, action, pending] = useActionState(addOutfitSet, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.sets.list,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setTitle('')
      setSlug('')
      setRarity('')
      setStyle('')
      setLabelSelect([])
      setAbility('')
      setSeason('')
      setSeasonCategory('')
      setDescription('')
      setEvolutionDrafts([])
      setGlowupEvolutionOrder('')
      setCategorySelect([])
      setHandheldBaseOnly(false)
      setEditSlug(false)
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

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from name — edit if needed"
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

        {categorySelect.includes('handhelds') && evolutionDrafts.length > 0 && (
          <FormControlLabel
            control={
              <Switch
                checked={handheldBaseOnly}
                onChange={(e) => setHandheldBaseOnly(e.target.checked)}
              />
            }
            label="Handhelds exclusive to base set"
          />
        )}

        <EvolutionEditor
          glowupEvolutionOrder={glowupEvolutionOrder}
          maxEvolutions={maxEvolutions}
          onChange={setEvolutionDrafts}
          onGlowupChange={setGlowupEvolutionOrder}
        />

        <Alert severity="info">
          Images can be added after saving — use the outfit set edit form, or edit each variant
          individually via its outfit variant form.
        </Alert>

        <input name="evolution_drafts" type="hidden" value={JSON.stringify(evolutionDrafts)} />
        <input name="glowup_evolution_order" type="hidden" value={glowupEvolutionOrder} />
        <input name="handheld_base_only" type="hidden" value={handheldBaseOnly ? 'true' : ''} />
        <input
          name="outfit_categories"
          type="hidden"
          value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
        />
      </Stack>
    </form>
  )
}
