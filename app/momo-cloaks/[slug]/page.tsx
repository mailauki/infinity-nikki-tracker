import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import PageShell from '@/components/page-shell'
import { getMomoCloak } from '@/hooks/data/momo-cloaks'
import { getUserRole } from '@/hooks/user'

import MomoCloakDetail from './momo-cloak-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cloak = await getMomoCloak(slug)

  return { title: cloak?.title ?? "Momo's Cloaks" }
}

async function MomoCloakContent({ slug }: { slug: string }) {
  const [cloak, role] = await Promise.all([getMomoCloak(slug), getUserRole()])

  // getMomoCloak uses maybeSingle() and returns null for an unknown slug.
  if (!cloak) notFound()

  return <MomoCloakDetail cloak={cloak} isAdmin={role === 'admin'} />
}

export default async function MomoCloakPage({ params }: Props) {
  const { slug } = await params

  return (
    <PageShell>
      <Suspense>
        <MomoCloakContent slug={slug} />
      </Suspense>
    </PageShell>
  )
}
