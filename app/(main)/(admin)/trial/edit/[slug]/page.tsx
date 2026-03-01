import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { createClient } from '@/lib/supabase/server'
import EditTrialForm from '@/components/forms/trial/edit-trial-form'

export default async function EditTrialPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <EditTrial params={params} />
      </Container>
    </Suspense>
  )
}

async function EditTrial({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: trial } = await supabase
    .from('trials')
    .select('id, slug, name, image_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!trial) notFound()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Edit Trial
      </Typography>
      <EditTrialForm trial={trial} />
    </Box>
  )
}
