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
import ImageUpload from '@/components/forms/image-upload'
import { Trial } from '@/lib/types/eureka'
import { Location } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/admin/form-context'
import { editTrial } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-trial'

export default function EditTrialForm({
  trial,
  locations,
  back,
}: {
  trial: Trial
  locations: Location[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [slug, setSlug] = useState(trial.slug ?? toSlug(trial.title))
  const [location, setLocation] = useState(trial.location ?? '')
  const [editSlug, setEditSlug] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(trial.image_url)

  const boundAction = editTrial.bind(null, trial.id, back)
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

        <TextField required defaultValue={trial.title} label="Title" name="title" />

        <input name="slug" type="hidden" value={slug} />
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

        <TextField defaultValue={trial.realm ?? ''} label="Realm" name="realm" />

        <TextField
          multiline
          defaultValue={trial.description ?? ''}
          label="Description"
          minRows={3}
          name="description"
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

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          size="xl"
          slug={trial.slug ?? undefined}
          table="trials"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />
      </Stack>
    </form>
  )
}
