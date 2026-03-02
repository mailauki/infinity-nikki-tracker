'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { toSlug } from '@/lib/utils'

type TrialRow = {
  id: number
  slug: string | null
  name: string
  image_url: string | null
}

export default function EditTrialForm({ trial }: { trial: TrialRow }) {
  const router = useRouter()
  const [name, setName] = useState(trial.name)
  const [slug, setSlug] = useState(trial.slug ?? toSlug(trial.name))
  const [imageUrl, setImageUrl] = useState(trial.image_url ?? '')
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
        name: name.trim(),
        slug: slug.trim(),
        image_url: imageUrl.trim() || null,
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

        <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />

        <TextField
          label="Slug"
          required
          value={slug}
          disabled={!editSlug}
          onChange={(e) => setSlug(e.target.value)}
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

        <TextField
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

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
