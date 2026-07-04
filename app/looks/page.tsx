import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Box, Skeleton, Typography } from '@mui/material'
import { getUserID } from '@/hooks/user'
import { getCustomLooks, getLookThumbnails, getOutfitSlugParts } from '@/hooks/data/custom-looks'
import { getProfile } from '@/hooks/data/user'
import { FREE_LOOKS_LIMIT } from '@/lib/types/looks'
import LookCard, { LooksLimitBanner } from './look-card'
import { deleteLook } from './actions'
import LooksToolbar from './looks-toolbar'
import LooksEmptyState from './looks-empty-state'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = { title: 'Custom Looks' }

export default function LooksPage() {
  return (
    <Suspense fallback={<LooksLoading />}>
      <LooksContent />
    </Suspense>
  )
}

async function LooksContent() {
  const user_id = await getUserID()
  if (!user_id) redirect('/login')

  const [looks, { profile }] = await Promise.all([getCustomLooks(user_id), getProfile(user_id)])

  const isPremium = profile?.is_premium ?? false
  const atLimit = !isPremium && looks.length >= FREE_LOOKS_LIMIT

  const [thumbMap, partMap] = await Promise.all([
    getLookThumbnails(looks),
    getOutfitSlugParts(looks),
  ])

  async function handleDelete(id: string) {
    'use server'
    return deleteLook(id)
  }

  return (
    <>
      <LooksToolbar atLimit={atLimit} />

      <PageShell maxWidth="wide">
        {!isPremium && looks.length > 0 && (
          <LooksLimitBanner count={looks.length} limit={FREE_LOOKS_LIMIT} />
        )}

        {looks.length === 0 ? (
          <LooksEmptyState />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {looks.map((look) => {
              const thumbnails = [...look.eureka_variant_slugs, ...look.outfit_variant_slugs]
                .slice(0, 6)
                .map((slug) => thumbMap.get(slug) ?? null)
                .filter((url): url is string => !!url)
              const accessories = look.outfit_variant_slugs.filter(
                (slug) => partMap.get(slug) === 'Accessories'
              ).length
              const counts = {
                pieces: look.outfit_variant_slugs.length - accessories,
                accessories,
                eureka: look.eureka_variant_slugs.length,
              }
              return (
                <LookCard
                  key={look.id}
                  counts={counts}
                  look={look}
                  thumbnails={thumbnails}
                  onDelete={handleDelete}
                />
              )
            })}
          </Box>
        )}

        {atLimit && (
          <Typography color="textSecondary" sx={{ textAlign: 'center' }} variant="caption">
            Upgrade to premium to create unlimited looks.{' '}
            <Link href="/profile" style={{ color: 'inherit' }}>
              Go to profile →
            </Link>
          </Typography>
        )}
      </PageShell>
    </>
  )
}

function LooksLoading() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} height={180} variant="rounded" />
      ))}
    </Box>
  )
}
