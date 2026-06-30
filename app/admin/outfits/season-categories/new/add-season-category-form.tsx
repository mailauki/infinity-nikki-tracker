'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { toSlug } from '@/lib/utils'
import { useFormConfig } from '@/app/admin/form-context'
import { addSeasonCategory } from './actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-season-category'

export default function AddSeasonCategoryForm() {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const [state, action, pending] = useActionState(addSeasonCategory, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.seasonCategories.list,
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
