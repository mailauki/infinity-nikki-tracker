import { Suspense } from 'react'

import { getUserID, getUserRole } from '@/hooks/user'
import { getEurekaSet } from '@/hooks/data/eureka-sets'
import { Stack, Button, Divider, Typography, Chip } from '@mui/material'
import type { Metadata } from 'next'
import { Category, ChevronRight } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import EurekaVariantColorFilter from '@/components/eureka/eureka-variant-color-filter'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import { countObtained, percent } from '@/hooks/count-obtained'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'

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

  const {
    image_url,
    eureka_set_trials,
    eureka_variants,
    rarity,
    label,
    style,
    colors,
    description,
  } = eurekaSet

  const { obtained, total } = countObtained(eureka_variants)

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ flex: 1, justifyContent: 'space-between' }}>
            <Stack sx={{ pt: 1, alignItems: 'center' }}>
              <LazyImage
                alt={slug || 'Eureka Variant'}
                size="xl"
                src={image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </LazyImage>
            </Stack>

            <Chip label={toTitle(label ?? '')} variant="outlined" />
          </Stack>

          <Stack
            direction="row"
            sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography color="textSecondary" variant="subtitle2">
              <RarityStars rarity={rarity!} />
            </Typography>

            <Typography color="textSecondary" variant="body1">
              {toTitle(style ?? '')}
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="body2">{description}</Typography>

        {eureka_set_trials.length > 0 && (
          <Stack>
            <Stack
              direction="row"
              sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <Button
                color="inherit"
                endIcon={<ChevronRight />}
                href={
                  eureka_set_trials.length > 1
                    ? '/eureka/trials'
                    : `/eureka/trials/${eureka_set_trials[0].trial}`
                }
                size="small"
              >
                {eureka_set_trials.length > 1
                  ? `${eureka_set_trials.length} trials`
                  : toTitle(eureka_set_trials[0].trial)}
              </Button>

              <ProgressChip percentage={percent(obtained, total)} size="sm" />
            </Stack>

            <Divider />
          </Stack>
        )}

        <EurekaVariantColorFilter
          colors={colors}
          eureka_variants={eureka_variants}
          isLoggedIn={isLoggedIn}
        />
      </Stack>
    </>
  )
}
