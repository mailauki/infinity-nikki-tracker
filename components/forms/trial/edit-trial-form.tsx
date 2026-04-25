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

export default function EditTrialForm({ trial, back }: { trial: Trial; back?: string }) {
  const router = useRouter()
  const backUrl = back ?? '/dashboard'
  const [title, setTitle] = useState(trial.title)
  const [slug, setSlug] = useState(trial.slug ?? toSlug(trial.title))
  const [realm, setRealm] = useState(trial.realm ?? '')
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
        realm: realm.trim() || null,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trial.id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push(backUrl)
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
          onChange={(e) => setTitle(e.target.value)}
        />

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

        <TextField
          label="Realm"
          value={realm}
          onChange={(e) => setRealm(e.target.value)}
        />

        <Stack spacing={0.5}>
          <FormLabel>Image</FormLabel>
          <ImageUpload
            slug={trial.slug ?? undefined}
            table="trials"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button href={backUrl} variant="outlined">
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
