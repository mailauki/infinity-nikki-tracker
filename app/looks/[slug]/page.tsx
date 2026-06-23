import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton, Stack } from '@mui/material'
import { getUserID } from '@/hooks/user'
import { getAllLookThumbnails, getCustomLook, getOutfitSlugParts } from '@/hooks/data/custom-looks'
import LookDetail from './look-detail'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const user_id = await getUserID()
  if (!user_id) return { title: 'Look' }
  const look = await getCustomLook(slug, user_id)
  return { title: look?.name ?? 'Look' }
}

export default function LookPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailLoading />}>
      <LookContent params={params} />
    </Suspense>
  )
}

async function LookContent({ params }: Props) {
  const { slug } = await params
  const user_id = await getUserID()
  if (!user_id) redirect('/login')

  const look = await getCustomLook(slug, user_id)
  if (!look) notFound()

  const [thumbMap, partMap] = await Promise.all([
    getAllLookThumbnails(look),
    getOutfitSlugParts([look]),
  ])

  const toPiece = (s: string) => ({ slug: s, image_url: thumbMap.get(s) ?? null })
  const accessories = look.outfit_variant_slugs.filter((s) => partMap.get(s) === 'Accessories')
  const accessorySet = new Set(accessories)
  const pieces = look.outfit_variant_slugs.filter((s) => !accessorySet.has(s))

  return (
    <LookDetail
      accessories={accessories.map(toPiece)}
      eureka={look.eureka_variant_slugs.map(toPiece)}
      href={look.slug ?? look.id}
      look={look}
      pieces={pieces.map(toPiece)}
    />
  )
}

function DetailLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton height={56} variant="rounded" />
      <Skeleton height={300} variant="rounded" />
    </Stack>
  )
}
