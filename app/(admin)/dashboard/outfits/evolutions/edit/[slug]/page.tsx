import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import EditEvolutionForm from './edit-evolution-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Evolution',
}

export default async function EditEvolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditEvolution params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditEvolution({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const referer = (await headers()).get('referer') ?? ''
  const refererPath = new URL(referer, 'http://localhost').pathname
  const back = refererPath.startsWith('/dashboard/') ? refererPath : '/dashboard/outfits/evolutions'

  const supabase = await createClient()

  const { data: evolution } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url')
    .eq('slug', slug)
    .single()

  if (!evolution) notFound()

  const { data: variantRows } = await supabase
    .from('outfit_variants')
    .select('id, slug, outfit_category, image_url, default, updated_at')
    .eq('evolution', slug)
    .order('id', { ascending: true })

  return <EditEvolutionForm back={back} evolution={evolution} variants={variantRows ?? []} />
}
