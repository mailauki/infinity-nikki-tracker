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
import { toSlug } from '@/lib/utils'
import { Location } from '@/lib/types/outfit'
import { MENU_PROPS } from '@/lib/types/props'
import { useFormConfig } from '@/app/admin/form-context'
import { addSeason } from './actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-season'

export default function AddSeasonForm({ locations }: { locations: Location[] }) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const [state, action, pending] = useActionState(addSeason, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.seasons.list,
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
      setLocation('')
      setDescription('')
      setEditSlug(false)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

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
          helperText="Auto-generated from title — edit if needed"
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
          helperText="Image can be added after saving"
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>
    </form>
  )
}
