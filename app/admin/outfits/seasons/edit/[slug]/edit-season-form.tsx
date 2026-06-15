'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { useFormConfig } from '@/app/admin/form-context'
import { editSeason } from './actions'
import { navLinksData } from '@/lib/nav-links'

type SeasonRow = {
  slug: string
  title: string
}

const FORM_ID = 'edit-season'

export default function EditSeasonForm({ season, back }: { season: SeasonRow; back: string }) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(season.title)
  const [slug, setSlug] = useState(season.slug)
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
      </Stack>
    </form>
  )
}
