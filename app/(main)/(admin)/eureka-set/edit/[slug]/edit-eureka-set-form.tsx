'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
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
  Typography,
} from '@mui/material'
import { ColorLens } from '@mui/icons-material'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import { createClient } from '@/lib/supabase/client'
import { toSlug, toSlugVariant, toTitle } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { Category, Color, EurekaSetRaw, EurekaVariant, Label, Style, Trial } from '@/lib/types/eureka'
import ColorSelect from '@/components/forms/eureka-set/color-select'
import { SparkleIcon } from '@/components/rarity-stars'
import ImageUpload from '@/components/forms/image-upload'

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
  colors: Color[]
  categories: Category[]
  initialColors: string[]
  initialDefaultColor?: string
  initialVariants?: EurekaVariant[]
  back?: string
}) {
  const router = useRouter()
  const backUrl = back ?? '/dashboard'
  const [title, setTitle] = useState(eurekaSet.title)
  const [slug, setSlug] = useState(eurekaSet.slug ?? toSlug(eurekaSet.title))
  const [rarity, setRarity] = useState<number | ''>(eurekaSet.rarity ?? '')
  const [description, setDescription] = useState(eurekaSet.description ?? '')
  const [style, setStyle] = useState(eurekaSet.style ?? '')
  const [label, setLabel] = useState(eurekaSet.label ?? '')
  const [selectedTrials, setSelectedTrials] = useState<string[]>(
    eurekaSet.eureka_set_trials?.map((t) => t.trial) ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState<boolean>(false)
  const [colorSelect, setColorSelect] = useState<string[]>(initialColors)
  const [defaultColor, setDefaultColor] = useState<string>(initialDefaultColor)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(initialVariants.map((v) => [v.slug, v.image_url]))
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
    setColorSelect(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    )
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('eureka_sets')
      .update({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        rarity: rarity === '' ? null : rarity,
        style: style || null,
        label: label || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eurekaSet.id)

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Replace junction rows for trials
    const originalTrials = eurekaSet.eureka_set_trials.map((t) => t.trial)
    const { error: deleteTrialsError } = await supabase
      .from('eureka_set_trials')
      .delete()
      .eq('eureka_set', slug.trim())
    if (deleteTrialsError) {
      setLoading(false)
      setError(deleteTrialsError.message)
      return
    }
    if (selectedTrials.length > 0) {
      const { error: insertTrialsError } = await supabase
        .from('eureka_set_trials')
        .insert(selectedTrials.map((t) => ({ eureka_set: slug.trim(), trial: t })))
      if (insertTrialsError) {
        // Restore original trial associations
        if (originalTrials.length > 0) {
          await supabase
            .from('eureka_set_trials')
            .insert(originalTrials.map((t) => ({ eureka_set: slug.trim(), trial: t })))
        }
        setLoading(false)
        setError('Failed to update trials. Your previous trial associations have been restored.')
        return
      }
    }

    const addedColors = colorSelect.filter((c) => !initialColors.includes(c))
    const removedColors = initialColors.filter((c) => !colorSelect.includes(c))

    if (addedColors.length > 0) {
      const newVariants = addedColors.flatMap((color) =>
        categories.map((cat) => ({
          eureka_set: slug.trim(),
          category: cat.slug,
          color,
          slug: toSlugVariant(slug.trim(), cat.slug, color),
          default: defaultColor ? color === defaultColor : false,
        }))
      )
      const { error: insertError } = await supabase.from('eureka_variants').insert(newVariants)
      if (insertError) {
        setLoading(false)
        setError(insertError.message)
        return
      }
    }

    if (removedColors.length > 0) {
      const { error: deleteError } = await supabase
        .from('eureka_variants')
        .delete()
        .eq('eureka_set', slug.trim())
        .in('color', removedColors)
      if (deleteError) {
        setLoading(false)
        setError(deleteError.message)
        return
      }
    }

    // Sync default flag: clear all, then set for chosen color
    const { error: clearDefaultError } = await supabase
      .from('eureka_variants')
      .update({ default: false })
      .eq('eureka_set', slug.trim())
    if (clearDefaultError) {
      setLoading(false)
      setError(clearDefaultError.message)
      return
    }
    if (defaultColor) {
      const { error: setDefaultError } = await supabase
        .from('eureka_variants')
        .update({ default: true })
        .eq('eureka_set', slug.trim())
        .eq('color', defaultColor)
      if (setDefaultError) {
        setLoading(false)
        setError(setDefaultError.message)
        return
      }
    }

    setLoading(false)
    router.push(backUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          required
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl>
          <InputLabel>Rarity</InputLabel>
          <Select
            label="Rarity"
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
          <Select label="Style" value={style} onChange={(e) => setStyle(e.target.value)}>
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
          <Select label="Label" value={label} onChange={(e) => setLabel(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {labels.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack spacing={0.5}>
          <Stack alignItems="center" direction="row" justifyContent="flex-end">
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
				<Box
					sx={{ 
						display: 'grid',
						gridTemplateColumns: '1fr 1fr 1fr',
						gap: { xs: 0.5, sm: 1, md: 2 },
					}}
				>
					{initialVariants.map((variant) => (
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

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href={backUrl} variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
