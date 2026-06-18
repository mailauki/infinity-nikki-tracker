'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { Location } from '@/lib/types/outfit'
import { MENU_PROPS } from '@/lib/types/props'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { editSeason } from './actions'
import { navLinksData } from '@/lib/nav-links'

type SeasonRow = {
  slug: string
  title: string
  location: string | null
  description: string | null
  image_url: string | null
}

const FORM_ID = 'edit-season'

export default function EditSeasonForm({
  season,
  locations,
  back,
}: {
  season: SeasonRow
  locations: Location[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(season.title)
  const [slug, setSlug] = useState(season.slug)
  const [location, setLocation] = useState(season.location ?? '')
  const [description, setDescription] = useState(season.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(season.image_url)
  const [editSlug, setEditSlug] = useState(false)

  const boundAction = editSeason.bind(null, season.slug, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.seasons.list,
      pending,
      showUpdateOnly: true,
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

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Edit with caution — changing the slug will break any outfit sets referencing this season"
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          // caption="Season Image"
					size="xl"
          slug={season.slug}
          table="seasons"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />
      </Stack>
    </form>
  )
}
