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
import { useFormConfig } from '@/app/(admin)/form-context'
import { addTrial } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-trial'

export default function AddTrialForm() {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const [state, action, pending] = useActionState(addTrial, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: navLinksData.dashboard.eureka.trials.add.replace('/new', ''), pending })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

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

        <TextField label="Realm" name="realm" />

        <TextField multiline label="Description" minRows={3} name="description" />

        <FormControl>
          <InputLabel>Location</InputLabel>
          <Select label="Location" name="location" defaultValue="">
            <MenuItem value="">—</MenuItem>
            <MenuItem value="Wishfield">Wishfield</MenuItem>
            <MenuItem value="Itzaland">Itzaland</MenuItem>
          </Select>
        </FormControl>

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload slug={slug} table="trials" url={imageUrl} onUpload={(url) => setImageUrl(url)} />
      </Stack>
    </form>
  )
}
