import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Typography } from '@mui/material'
import type { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrial } from '@/hooks/data/trials'
import { getUserRole } from '@/hooks/user'
import EurekaSetCard from './eureka-set-card'
import LazyImage from '@/components/lazy-image'
import CardGrid from '@/components/card-grid'
import SlugToolBar from '@/components/slug-toolbar'
import PageShell from '@/components/page-shell'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trial = await getTrial(slug)
  if (!trial) return {}
  return { title: trial.title }
}

export default async function TrialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <Trial slug={slug} />
    </Suspense>
  )
}

async function Trial({ slug }: { slug: string }) {
  const [trial, eurekaSets, role] = await Promise.all([
    getTrial(slug),
    getEurekaSets(),
    getUserRole(),
  ])
  const isAdmin = role === 'admin'
  if (!trial) notFound()

  const trialSets = eurekaSets
    .filter((set) => set.eureka_set_trials.some((t) => t.trial === trial.slug))
    .sort((a, b) => b.rarity! - a.rarity!)

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <PageShell>
        <LazyImage image={trial.image_url!} kind="media" sx={{ height: 360 }} title={trial.title} />
        <Typography variant="body2">{trial.description}</Typography>
        <CardGrid sx={{ py: 0 }}>
          {trialSets.map((eurekaSet) => (
            <EurekaSetCard key={eurekaSet.slug} eurekaSet={eurekaSet} />
          ))}
        </CardGrid>
      </PageShell>
    </>
  )
}
