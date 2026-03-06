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
import { Trial } from '@/lib/types/eureka'

export default function EditTrialForm({ trial }: { trial: Trial }) {
  const router = useRouter()
  const [title, setTitle] = useState(trial.title)
  const [slug, setSlug] = useState(trial.slug ?? toSlug(trial.title))
  const [imageUrl, setImageUrl] = useState<string | null>(trial.image_url)
  const [editSlug, setEditSlug] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('trials')
      .update({
        title: title.trim(),
        slug: slug.trim(),
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trial.id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/trial')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Used in the URL — edit with caution"
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
        />

        <Stack spacing={0.5}>
          <FormLabel>Image</FormLabel>
          <ImageUpload
            url={imageUrl}
            table="trials"
            slug={trial.slug ?? undefined}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" href="/trial">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
