import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton, Stack } from '@mui/material'
import { getUserID } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getCustomLook } from '@/hooks/data/custom-looks'
import { flattenEurekaVariants, flattenOutfitVariants } from '@/lib/look-utils'
import LookBuilder from '@/components/looks/look-builder'
import { updateLook } from '../../actions'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Edit Look` }
}

export default function EditLookPage({ params }: Props) {
  return (
    <Suspense fallback={<BuilderLoading />}>
      <EditLookContent params={params} />
    </Suspense>
  )
}

async function EditLookContent({ params }: Props) {
  const { slug } = await params
  const user_id = await getUserID()
  if (!user_id) redirect('/login')

  const [look, eurekaSets, outfitSets, eurekaCategories, outfitCategories] = await Promise.all([
    getCustomLook(slug, user_id),
    getEurekaSets(),
    getOutfitSets(),
    getEurekaCategories(),
    getOutfitCategories(),
  ])

  if (!look) notFound()

  const eurekaVariants = flattenEurekaVariants(eurekaSets ?? [], eurekaCategories)
  const outfitVariants = flattenOutfitVariants(outfitSets ?? [], outfitCategories)

  const lookId = look.id
  async function handleUpdate(data: {
    name: string
    description: string | null
    eureka_variant_slugs: string[]
    outfit_variant_slugs: string[]
  }) {
    'use server'
    return updateLook(lookId, data)
  }

  return (
    <LookBuilder
      cancelHref={`/looks/${look.slug ?? look.id}`}
      eurekaCategories={eurekaCategories}
      eurekaVariants={eurekaVariants}
      initialLook={look}
      outfitCategories={outfitCategories}
      outfitVariants={outfitVariants}
      onSave={handleUpdate}
    />
  )
}

function BuilderLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton height={56} variant="rounded" />
      <Skeleton height={400} variant="rounded" />
    </Stack>
  )
}
