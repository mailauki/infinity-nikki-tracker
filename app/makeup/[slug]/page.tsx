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

  // Covers a bad slug. Note `standalone_pieces` DOES resolve here — it has a
  // real makeup_sets row, and createMakeupSet emits a synthetic bucket under
  // the same slug carrying the set-less pieces — so this page renders it as a
  // normal set rather than 404ing the way it did when the bucket was
  // client-side only.
  if (!makeupSet) notFound()

  return <MakeupSetDetail isAdmin={role === 'admin'} isLoggedIn={!!user_id} makeupSet={makeupSet} />
}
