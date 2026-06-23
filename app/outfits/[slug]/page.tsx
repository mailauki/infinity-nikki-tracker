import { Suspense } from 'react'

import { getUserID, getUserRole } from '@/hooks/user'
import { getOutfitSet } from '@/hooks/data/outfit-sets'
import type { Metadata } from 'next'
import OutfitSetDetail from './outfit-set-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const outfitSet = await getOutfitSet(slug)

  return { title: outfitSet.title }
}

export default async function OutfitSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <OutfitSet slug={slug} />
    </Suspense>
  )
}

async function OutfitSet({ slug }: { slug: string }) {
  const [outfitSet, user_id, role] = await Promise.all([
    getOutfitSet(slug),
    getUserID(),
    getUserRole(),
  ])
  const isLoggedIn = !!user_id
  const isAdmin = role === 'admin'

  return <OutfitSetDetail isAdmin={isAdmin} isLoggedIn={isLoggedIn} outfitSet={outfitSet} />
}
