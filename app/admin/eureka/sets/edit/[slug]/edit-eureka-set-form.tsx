'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
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
} from '@mui/material'
import { CheckBox, CheckBoxOutlineBlank, ColorLens } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import { toSlug, toTitle } from '@/lib/utils'
import {
  EurekaCategory,
  EurekaColor,
  EurekaSetRaw,
  EurekaVariant,
  Label,
  Style,
  Trial,
} from '@/lib/types/eureka'
import ColorSelect from '@/components/forms/eureka-set/color-select'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { editEurekaSet } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-eureka-set'

export default function EditEurekaSetForm({
  eurekaSet,
  trials,
  styles,
  labels,
  colors,
  categories,
  initialColors,
  initialDefaultColor = '',
  initialVariants = [],
  back,
}: {
  eurekaSet: EurekaSetRaw
  trials: Trial[]
  styles: Style[]
  labels: Label[]
  colors: EurekaColor[]
  categories: EurekaCategory[]
  initialColors: string[]
  initialDefaultColor?: string
  initialVariants?: EurekaVariant[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(eurekaSet.title)
  const [slug, setSlug] = useState(eurekaSet.slug ?? toSlug(eurekaSet.title))
  const [rarity, setRarity] = useState<number | ''>(eurekaSet.rarity ?? '')
  const [description, setDescription] = useState(eurekaSet.description ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [label, setLabel] = useState(eurekaSet.label ?? '')
  const [selectedTrials, setSelectedTrials] = useState<string[]>(
    eurekaSet.eureka_set_trials?.map((t) => t.trial) ?? []
  )
  const [colorSelect, setColorSelect] = useState<string[]>(initialColors)
  const [defaultColor, setDefaultColor] = useState(initialDefaultColor)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(initialVariants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )

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

  const originalTrials = eurekaSet.eureka_set_trials.map((t) => t.trial)
  const boundAction = editEurekaSet.bind(null, eurekaSet.id, initialColors, back)
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
              MenuProps={MENU_PROPS}
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
                ...group.map((t) => {
                  const selected = selectedTrials.includes(t.slug)
                  const SelectionIcon = selected ? CheckBox : CheckBoxOutlineBlank
                  return (
                    <MenuItem key={t.slug} value={t.slug!}>
                      <SelectionIcon
                        fontSize="small"
                        style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                      />
                      <ListItemText primary={t.title} />
                    </MenuItem>
                  )
                }),
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
            MenuProps={MENU_PROPS}
            input={<OutlinedInput label="Default Color" />}
            renderValue={(slug) => {
              const color = colors.find((c) => c.slug === slug)
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    icon={
                      <LazyImage
                        alt={slug}
                        color="transparent"
                        size="xs"
                        src={color?.image_url ?? ''}
                      >
                        <ColorLens fontSize="inherit" />
                      </LazyImage>
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
                    <LazyImage
                      alt={color?.title ?? slug}
                      color="transparent"
                      size="xs"
                      src={color?.image_url ?? ''}
                    >
                      <ColorLens fontSize="inherit" />
                    </LazyImage>
                  </ListItemAvatar>
                  <ListItemText primary={color?.title ?? slug} />
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: 0,
          }}
        >
          {initialVariants.length > 0 &&
            initialVariants.map((variant) => (
              <ImageUpload
                key={variant.slug}
                caption={`${toTitle(variant.category ?? '')} • ${toTitle(variant.color ?? '')}`}
                slug={variant.slug ?? undefined}
                table="eureka_variants"
                url={variantImages[variant.slug] ?? null}
                onUpload={(url) => setVariantImages((prev) => ({ ...prev, [variant.slug]: url }))}
              />
            ))}
        </Box>

        {/* Hidden inputs for server action */}
        <input name="selected_trials" type="hidden" value={JSON.stringify(selectedTrials)} />
        <input name="original_trials" type="hidden" value={JSON.stringify(originalTrials)} />
        <input name="color_select" type="hidden" value={JSON.stringify(colorSelect)} />
        <input name="default_color" type="hidden" value={defaultColor} />
        <input name="categories" type="hidden" value={JSON.stringify(categories)} />
      </Stack>
    </form>
  )
}
