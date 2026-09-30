'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Link as Anchor, Typography } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import LinkedSetCard from '@/components/linked-set-card'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ReleaseLine from '@/components/release-line'
import SetDetailCard from '@/components/set-detail-card'
import { formatRelease, setRelease } from '@/hooks/release'
import { MomoCloak } from '@/lib/types/momo'
import { linkedSetHref } from '@/lib/types/outfit'

import { useMomoCloakData } from '../momo-cloak-context'

export default function MomoCloakDetail({
  cloak,
  isAdmin = false,
}: {
  cloak: MomoCloak
  isAdmin?: boolean
}) {
  const { obtainedSlugs, isLoggedIn } = useMomoCloakData()
  const { mode } = useOutfitImageMode()
  const isObtained = obtainedSlugs.has(cloak.slug)

  const associatedRow = cloak.outfitSet ? (
    <LinkedSetCard
      href={linkedSetHref('outfits', cloak.outfitSet)}
      image={cloak.outfitSet.alt_image_url || cloak.outfitSet.image_url}
      title={cloak.outfitSet.title}
    />
  ) : null

  const seasonRow = (
    <>
      <Anchor
        component={Link}
        href={`/seasons/${cloak.seasons}`}
        sx={{ cursor: 'pointer' }}
        underline="hover"
        variant="title"
      >
        {cloak.season?.title}
      </Anchor>
      <Typography size="large" sx={{ textAlign: 'right' }} variant="body">
        {cloak.seasonCategory?.title}
      </Typography>
    </>
  )

  // Only included when there's actually something to show — extraRows wraps
  // every entry in its own row regardless of what it renders, so an
  // unconditional ReleaseLine would leave a blank gap when no date/version data
  // exists yet.
  const release = setRelease(cloak)
  const releaseRow = formatRelease(release) ? <ReleaseLine release={release} /> : null

  // 74 of 119 cloaks have no season and 78 have no outfit_set, so each row is
  // dropped when its data is absent — otherwise they render an empty card and a
  // `/seasons/null` link.
  const extraRows = [cloak.seasons ? seasonRow : null, releaseRow, associatedRow]
    .filter((row): row is React.ReactElement => row !== null)
    .map((row, i) => <Fragment key={i}>{row}</Fragment>)

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <SetDetailCard
        description={cloak.description}
        extraRows={extraRows}
        isLoggedIn={isLoggedIn}
        media={
          <LazyImage
            image={
              resolveOutfitImage(mode, { image: cloak.image_url, alt: cloak.alt_image_url }) ?? ''
            }
            kind="media"
            sx={{
              width: '100%',
              maxWidth: 320,
              aspectRatio: mode === 'alt' ? '1 / 1' : '2 / 3',
            }}
            title={cloak.title}
          />
        }
        obtained={isObtained ? 1 : 0}
        rarity={cloak.rarity ?? 0}
        style={cloak.location}
        title={cloak.title}
        total={1}
      />
    </>
  )
}
