import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditEurekaSetForm from '@/components/forms/eureka-set/edit-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Eureka Set',
}

export default async function EditEurekaSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <EditEurekaSet params={params} searchParams={searchParams} />
        </Stack>
      </Container>
    </Suspense>
  )
}

async function EditEurekaSet({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back } = await searchParams
  const supabase = await createClient()

  const { data: eurekaSet } = await supabase
    .from('eureka_sets')
    .select('id, slug, title, rarity, style, label, updated_at, eureka_set_trials ( trial )')
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
    .eq('eureka_set', eurekaSet.slug!)
    .not('color', 'is', null)
  const initialColors = [...new Set(variantRows?.map((v) => v.color as string) ?? [])]

  return (
    <EditEurekaSetForm
      back={back}
      categories={categories ?? []}
      colors={colors ?? []}
      eurekaSet={eurekaSet}
      initialColors={initialColors}
      labels={labels ?? []}
      styles={styles ?? []}
      trials={trials ?? []}
    />
  )
}
