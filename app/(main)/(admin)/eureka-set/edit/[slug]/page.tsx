import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Typography } from '@mui/material'
import { createClient } from '@/lib/supabase/server'
import EditEurekaSetForm from '@/components/forms/eureka-set/edit-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Edit Eureka Set',
}

export default async function EditEurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <PageContainer title='Edit Eureka Set' size='sm'>
				<EditEurekaSet params={params} />
			</PageContainer>
    </Suspense>
  )
}

async function EditEurekaSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: eurekaSet } = await supabase
    .from('eureka_sets')
    .select('id, slug, title, rarity, style, label, trial, updated_at')
    .eq('slug', slug)
    .single()

  if (!eurekaSet) notFound()

  const [trials, styles, labels, colors, categories] = await Promise.all([
    getTrials(),
    getStyles(),
    getLabels(),
    getColors(),
    getCategories(),
  ])

  const { data: variantRows } = await supabase
    .from('eureka_variants')
    .select('color')
    .eq('eureka_set', eurekaSet.title)
    .not('color', 'is', null)
  const initialColors = [...new Set(variantRows?.map((v) => v.color as string) ?? [])]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Edit Eureka Set
      </Typography>
      <EditEurekaSetForm
        eurekaSet={eurekaSet}
        trials={trials ?? []}
        styles={styles ?? []}
        labels={labels ?? []}
        colors={colors ?? []}
        categories={categories ?? []}
        initialColors={initialColors}
      />
    </Box>
  )
}
