'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/admin/form-context'
import { editSeasonCategory } from './actions'
import { navLinksData } from '@/lib/nav-links'

type SeasonCategoryRow = {
  slug: string
  title: string
  description: string | null
  image_url: string | null
}

const FORM_ID = 'edit-season-category'

export default function EditSeasonCategoryForm({
  category,
  back,
}: {
  category: SeasonCategoryRow
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(category.title)
  const [slug, setSlug] = useState(category.slug)
  const [description, setDescription] = useState(category.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(category.image_url)
  const [editSlug, setEditSlug] = useState(false)

  const boundAction = editSeasonCategory.bind(null, category.slug, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.seasonCategories.list,
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

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Edit with caution — changing the slug will break any outfit sets referencing this category"
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

        <Stack spacing={1}>
          <Typography variant="subtitle2">Image</Typography>
          <input name="image_url" type="hidden" value={imageUrl ?? ''} />
          <ImageUpload
            caption="Season Category Image"
            size="xl"
            slug={category.slug}
            table="season_categories"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>
      </Stack>
    </form>
  )
}
