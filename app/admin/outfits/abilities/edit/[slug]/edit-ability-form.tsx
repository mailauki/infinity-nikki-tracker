'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { useFormConfig } from '@/app/admin/form-context'
import { editAbility } from './actions'
import { navLinksData } from '@/lib/nav-links'
import ImageUpload from '@/components/forms/image-upload'

type AbilityRow = {
  slug: string
  title: string
  image_url: string | null
}

const FORM_ID = 'edit-ability'

export default function EditAbilityForm({ ability, back }: { ability: AbilityRow; back: string }) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(ability.title)
  const [slug, setSlug] = useState(ability.slug)
  const [editSlug, setEditSlug] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(ability.image_url)

  const boundAction = editAbility.bind(null, ability.slug, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.abilities.list,
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

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
          helperText="Edit with caution — changing the slug will break any outfit sets referencing this ability"
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

        <Stack spacing={1}>
          <Typography variant="subtitle2">Image</Typography>
          <ImageUpload
            caption="Ability Image"
            slug={ability.slug}
            table="abilities"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>
      </Stack>
    </form>
  )
}
