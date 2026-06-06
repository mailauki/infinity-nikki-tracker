import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEurekaSetForm from './edit-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Eureka Set',
}

export default async function EditEurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEurekaSet params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditEurekaSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const back = '/admin/eureka/sets'

  const supabase = await createClient()

  const { data: eurekaSet } = await supabase
    .from('eureka_sets')
    .select(
      'id, slug, title, description, rarity, style, label, updated_at, eureka_set_trials ( trial )'
    )
    .eq('slug', slug)
    .single()

  if (!eurekaSet || !eurekaSet.slug) notFound()

  const [trials, styles, labels, colors, categories] = await Promise.all([
    getTrials(),
    getStyles(),
    getLabels(),
    getEurekaColors(),
    getEurekaCategories(),
  ])

  const { data: variantRows, error: variantRowsError } = await supabase
    .from('eureka_variants')
    .select('id, eureka_set, color, category, slug, image_url, default, created_at, updated_at')
    .eq('eureka_set', eurekaSet.slug!)
    .not('color', 'is', null)
  if (variantRowsError) throw variantRowsError
  const initialColors = [...new Set(variantRows.map((v) => v.color as string))]
  const initialDefaultColor = variantRows.find((v) => v.default)?.color ?? ''
  const initialVariants = variantRows

  return (
    <EditEurekaSetForm
      back={back}
      categories={categories ?? []}
      colors={colors ?? []}
      eurekaSet={eurekaSet}
      initialColors={initialColors}
      initialDefaultColor={initialDefaultColor}
      initialVariants={initialVariants}
      labels={labels ?? []}
      styles={styles ?? []}
      trials={trials ?? []}
    />
  )
}
