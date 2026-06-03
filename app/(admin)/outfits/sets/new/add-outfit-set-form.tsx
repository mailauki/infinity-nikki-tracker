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
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { Ability, EvolutionDraft, OutfitCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import { useFormConfig } from '@/app/(admin)/form-context'
import { addOutfitSet } from '../actions'
import { navLinksData } from '@/lib/nav-links'
import EvolutionEditor from '../evolution-editor'

const FORM_ID = 'add-outfit-set'

export default function AddOutfitSetForm({
  styles,
  labels,
  abilities,
  outfitCategories,
}: {
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  outfitCategories: OutfitCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [label2, setLabel2] = useState('')
  const [ability, setAbility] = useState('')
  const [description, setDescription] = useState('')
  const [evolutionDrafts, setEvolutionDrafts] = useState<EvolutionDraft[]>([])
  const [defaultEvolutionOrder, setDefaultEvolutionOrder] = useState<number | ''>('')
  const [categorySelect, setCategorySelect] = useState<string[]>([])
  const [editSlug, setEditSlug] = useState(false)

  function handleCategoryChange(e: SelectChangeEvent<string[]>) {
    const { value } = e.target
    setCategorySelect(typeof value === 'string' ? value.split(',') : value)
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
      backUrl: navLinksData.dashboard.outfits.sets.add.replace('/new', ''),
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

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
          maxEvolutions={maxEvolutions}
          onChange={setEvolutionDrafts}
          onDefaultChange={setDefaultEvolutionOrder}
        />

        <Alert severity="info">
          Images can be added after saving — use the outfit set edit form, or edit each variant
          individually via its outfit variant form.
        </Alert>

        <input name="evolution_drafts" type="hidden" value={JSON.stringify(evolutionDrafts)} />
        <input name="default_evolution_order" type="hidden" value={defaultEvolutionOrder} />
        <input
          name="outfit_categories"
          type="hidden"
          value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
        />
      </Stack>
    </form>
  )
}
