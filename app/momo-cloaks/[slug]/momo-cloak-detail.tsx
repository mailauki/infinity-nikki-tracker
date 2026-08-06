'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Link as Anchor, Typography, Card, CardActionArea, CardHeader } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import SetDetailCard from '@/components/set-detail-card'
import { MomoCloak } from '@/lib/types/momo'

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

  const associatedRow = (
    <>
      <Card>
        <CardActionArea component={Link} href={`/outfits/${cloak.outfitSet?.slug}`}>
          <CardHeader
            avatar={
              <LazyImage
                kind="avatar"
                src={cloak.outfitSet?.alt_image_url || cloak.outfitSet?.image_url}
              />
            }
            sx={{ py: 1, px: 1.5 }}
            title={cloak.outfitSet?.title}
          />
        </CardActionArea>
      </Card>
      {/* TODO: Make into reusable mini card for outfits, makeup, and cloaks */}
    </>
  )

  const seasonRow = (
    <>
      <Anchor
        component={Link}
        href={`/outfits/seasons/${cloak.seasons}`}
        sx={{ cursor: 'pointer' }}
        underline="hover"
        variant="subtitle2"
      >
        {cloak.season?.title}
      </Anchor>
      <Typography sx={{ textAlign: 'right' }} variant="body1">
        {cloak.seasonCategory?.title}
      </Typography>
    </>
  )

  // 74 of 119 cloaks have no season and 78 have no outfit_set, so each row is
  // dropped when its data is absent — otherwise they render an empty card and a
  // `/outfits/seasons/null` link.
  const extraRows = [cloak.seasons ? seasonRow : null, cloak.outfitSet ? associatedRow : null]
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
