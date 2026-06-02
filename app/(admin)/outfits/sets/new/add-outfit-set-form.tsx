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
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { Ability, Evolution, OutfitCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import { useFormConfig } from '@/app/(admin)/form-context'
import { addOutfitSet } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-outfit-set'

export default function AddOutfitSetForm({
  styles,
  labels,
  abilities,
  evolutions,
  outfitCategories,
}: {
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  evolutions: Evolution[]
  outfitCategories: OutfitCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [ability, setAbility] = useState('')
  const [description, setDescription] = useState('')
  const [evolutionSelect, setEvolutionSelect] = useState<string[]>([])
  const [defaultEvolution, setDefaultEvolution] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setEvolutionSelect((prev) =>
      prev.length > maxEvolutions ? prev.slice(0, maxEvolutions) : prev
    )
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
            {evolutions.map((e) => (
              <MenuItem
                key={e.slug}
                disabled={
                  evolutionSelect.length >= maxEvolutions && !evolutionSelect.includes(e.slug)
                }
                value={e.slug}
              >
                {e.title}
              </MenuItem>
            ))}
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

        <Alert severity="info">
          Images can be added after saving — use the outfit set edit form, or edit each variant
          individually via its outfit variant form.
        </Alert>

        <input name="evolution_select" type="hidden" value={JSON.stringify(evolutionSelect)} />
        <input name="default_evolution" type="hidden" value={defaultEvolution} />
        <input name="outfit_categories" type="hidden" value={JSON.stringify(outfitCategories)} />
      </Stack>
    </form>
  )
}
