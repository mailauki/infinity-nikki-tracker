import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getUserID, getUserRole } from '@/hooks/user'
import { getMakeupSet } from '@/hooks/data/makeup-sets'
import MakeupSetDetail from './makeup-set-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const makeupSet = await getMakeupSet(slug)

  return { title: makeupSet?.title ?? 'Makeup' }
}

export default async function MakeupSetPage({ params }: Props) {
  const { slug } = await params

  return (
    <Suspense>
      <MakeupSetLoader slug={slug} />
    </Suspense>
  )
}

async function MakeupSetLoader({ slug }: { slug: string }) {
  const [makeupSet, user_id, role] = await Promise.all([
    getMakeupSet(slug),
    getUserID(),
    getUserRole(),
  ])

  // Covers both a bad slug and 'standalone-pieces', which is a client-side
  // pseudo-set with no row in makeup_sets and therefore no detail page.
  if (!makeupSet) notFound()

  return <MakeupSetDetail isAdmin={role === 'admin'} isLoggedIn={!!user_id} makeupSet={makeupSet} />
}
