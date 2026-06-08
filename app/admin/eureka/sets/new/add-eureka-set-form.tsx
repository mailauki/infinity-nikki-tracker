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
  ListItemAvatar,
  ListItemText,
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
import { ColorLens } from '@mui/icons-material'
import LazyAvatar from '@/components/lazy-avatar'
import { toSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { EurekaCategory, EurekaColor, Label, Style, Trial } from '@/lib/types/eureka'
import ColorSelect from '@/components/forms/eureka-set/color-select'
import RarityToggle from '@/components/filter/rarity-toggle'
import { useFormConfig } from '@/app/admin/form-context'
import { addEurekaSet } from '../actions'
import { navLinksData } from '@/lib/nav-links'
import { Button } from '@mui/material'

const FORM_ID = 'add-eureka-set'

export default function AddEurekaSetForm({
  trials,
  styles,
  labels,
  colors,
  categories,
}: {
  trials: Trial[]
  styles: Style[]
  labels: Label[]
  colors: EurekaColor[]
  categories: EurekaCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTrials, setSelectedTrials] = useState<string[]>([])
  const [editSlug, setEditSlug] = useState(false)
  const [colorSelect, setColorSelect] = useState<string[]>([])
  const [defaultColor, setDefaultColor] = useState('')

  const maxColorsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxColors = typeof rarity === 'number' ? (maxColorsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setColorSelect((prev) => (prev.length > maxColors ? prev.slice(0, maxColors) : prev))
  }, [maxColors])

  useEffect(() => {
    if (defaultColor && !colorSelect.includes(defaultColor)) setDefaultColor('')
  }, [colorSelect, defaultColor])

  const handleColorChange = (event: SelectChangeEvent<typeof colorSelect>) => {
    const {
      target: { value },
    } = event
    setColorSelect(typeof value === 'string' ? value.split(',') : value)
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  const [state, action, pending] = useActionState(addEurekaSet, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.eureka.sets.list,
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
      setLabel('')
      setDescription('')
      setSelectedTrials([])
      setEditSlug(false)
      setColorSelect([])
      setDefaultColor('')
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

        <Stack spacing={0.5}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={() =>
                setSelectedTrials(
                  selectedTrials.length === trials.length ? [] : trials.map((t) => t.slug!)
                )
              }
            >
              {selectedTrials.length === trials.length
                ? 'Deselect all trials'
                : 'Select all trials'}
            </Button>
          </Stack>

          <FormControl>
            <InputLabel>Trials</InputLabel>
            <Select
              multiple
              label="Trials"
              renderValue={(selected) =>
                trials
                  .filter((t) => selected.includes(t.slug!))
                  .map((t) => t.title)
                  .join(', ')
              }
              value={selectedTrials}
              onChange={(e) =>
                setSelectedTrials(
                  typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                )
              }
            >
              {Object.entries(
                trials.reduce<Record<string, typeof trials>>((groups, t) => {
                  const realm = t.realm ?? 'Other'
                  ;(groups[realm] ??= []).push(t)
                  return groups
                }, {})
              ).flatMap(([realm, group]) => [
                <ListSubheader key={realm}>{realm}</ListSubheader>,
                ...group.map((t) => (
                  <MenuItem key={t.slug} value={t.slug!}>
                    {t.title}
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>
        </Stack>

        <ColorSelect
          colorSelect={colorSelect}
          colors={colors}
          handleChange={handleColorChange}
          maxColors={maxColors}
        />

        <FormControl disabled={colorSelect.length === 0}>
          <InputLabel>Default Color</InputLabel>
          <Select
            input={<OutlinedInput label="Default Color" />}
            renderValue={(slug) => {
              const color = colors.find((c) => c.slug === slug)
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    icon={
                      <LazyAvatar
                        alt={slug}
                        color="transparent"
                        size="xs"
                        src={color?.image_url ?? ''}
                      >
                        <ColorLens fontSize="inherit" />
                      </LazyAvatar>
                    }
                    label={color?.title ?? slug}
                  />
                </Box>
              )
            }}
            value={defaultColor}
            onChange={(e) => setDefaultColor(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {colorSelect.map((slug) => {
              const color = colors.find((c) => c.slug === slug)
              return (
                <MenuItem key={slug} value={slug}>
                  <ListItemAvatar sx={{ mr: -1.5 }}>
                    <LazyAvatar
                      alt={color?.title ?? slug}
                      color="transparent"
                      size="xs"
                      src={color?.image_url ?? ''}
                    >
                      <ColorLens fontSize="inherit" />
                    </LazyAvatar>
                  </ListItemAvatar>
                  <ListItemText primary={color?.title ?? slug} />
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Alert severity="info">
          Images can be added after saving — use the eureka set edit form, or edit each variant
          individually via its eureka variant form.
        </Alert>

        {/* Hidden inputs for server action */}
        <input name="selected_trials" type="hidden" value={JSON.stringify(selectedTrials)} />
        <input name="color_select" type="hidden" value={JSON.stringify(colorSelect)} />
        <input name="default_color" type="hidden" value={defaultColor} />
        <input name="categories" type="hidden" value={JSON.stringify(categories)} />
      </Stack>
    </form>
  )
}
