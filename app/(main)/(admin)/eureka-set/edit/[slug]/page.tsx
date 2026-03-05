import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { createClient } from '@/lib/supabase/server'
import { getLabels, getStyles, getTrials } from '@/hooks/data'
import EditEurekaSetForm from '@/components/forms/eureka-set/edit-eureka-set-form'

export default async function EditEurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <EditEurekaSet params={params} />
      </Container>
    </Suspense>
  )
}

async function EditEurekaSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: eurekaSet } = await supabase
    .from('eureka_sets')
    .select('id, slug, title, rarity, style, label, trial')
    .eq('slug', slug)
    .single()

  if (!eurekaSet) notFound()

  const [trials, styles, labels] = await Promise.all([getTrials(), getStyles(), getLabels()])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Edit Eureka Set
      </Typography>
      <EditEurekaSetForm eurekaSet={eurekaSet} trials={trials ?? []} styles={styles ?? []} labels={labels ?? []} />
    </Box>
  )
}
