import { Suspense } from 'react'

import { getUserID, getUserRole } from '@/hooks/user'
import { getEurekaSet } from '@/hooks/data/eureka-sets'
import type { Metadata } from 'next'
import EurekaSetDetail from './eureka-set-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const eureka = await getEurekaSet(slug)

  return { title: eureka.title }
}

export default async function EurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <EurekaSet slug={slug} />
    </Suspense>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
  const [eurekaSet, user_id, role] = await Promise.all([
    getEurekaSet(slug),
    getUserID(),
    getUserRole(),
  ])
  const isLoggedIn = !!user_id
  const isAdmin = role === 'admin'

  return <EurekaSetDetail eurekaSet={eurekaSet} isAdmin={isAdmin} isLoggedIn={isLoggedIn} />
}
