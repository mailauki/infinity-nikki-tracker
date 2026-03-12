'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  FormLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { toSlug } from '@/lib/utils'
import ImageUpload from '@/components/forms/image-upload'

export default function AddTrialForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNameChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('trials').insert([
      {
        title: title.trim(),
        slug: slug.trim(),
        image_url: imageUrl || null,
      },
    ])

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          required
          label="Title"
          value={title}
          onChange={(e) => handleNameChange(e.target.value)}
        />

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

        <Stack spacing={0.5}>
          <FormLabel>Image</FormLabel>
          <ImageUpload
            slug={slug}
            table="trials"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href="/trial" variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Add Trial'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
