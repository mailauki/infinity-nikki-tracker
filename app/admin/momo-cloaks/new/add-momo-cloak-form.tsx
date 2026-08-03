'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { toSlug } from '@/lib/utils'
import { Location, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import { useFormConfig } from '@/app/admin/form-context'
import { addMomoCloak } from '../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'add-momo-cloak'

export default function AddMomoCloakForm({
  styles,
  labels,
  seasons,
  seasonCategories,
  locations,
}: {
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  locations: Location[]
}) {
  const { setFormConfig } = useFormConfig()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [season, setSeason] = useState('')
  const [seasonCategory, setSeasonCategory] = useState('')
  const [location, setLocation] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugEdited) setSlug(toSlug(value))
  }

  const [state, action, pending] = useActionState(addMomoCloak, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    // The action hands back a redirect target instead of calling Next's
    // redirect(); see the NOTE at the top of app/admin/momo-cloaks/actions.ts.
    if (state && 'redirectTo' in state && state.redirectTo) {
      setFormConfig({ savedTitle: state.savedTitle })
      router.push(state.redirectTo)
      return
    }
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setTitle('')
      setSlug('')
      setDescription('')
      setRarity('')
      setStyle('')
      setLabel('')
      setSeason('')
      setSeasonCategory('')
      setLocation('')
      setSlugEdited(false)
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

        <SlugField
          required
          helperText="Auto-generated from name — edit if needed"
          value={slug}
          onChange={setSlug}
          onUserEdit={() => setSlugEdited(true)}
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

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
          <InputLabel>Location</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {locations.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Alert severity="info">
          Images can be added after saving — use the Momo&apos;s Cloak edit form.
        </Alert>
      </Stack>
    </form>
  )
}
