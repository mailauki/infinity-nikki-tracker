'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Button, Typography } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'
import { MomoCloak } from '@/lib/types/momo'
import { toTitle } from '@/lib/utils'

import { useMomoCloakData } from '../momo-cloak-context'

// SetDetailCard already wraps each extraRows entry in its own space-between
// Stack, so MetaRow only needs to supply the two children — no nested wrapper.
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </>
  )
}

export default function MomoCloakDetail({ cloak }: { cloak: MomoCloak }) {
  const { obtainedSlugs, isLoggedIn } = useMomoCloakData()
  const isObtained = obtainedSlugs.has(cloak.slug)

  const extraRows = [
    cloak.seasons ? <MetaRow key="season" label="Season" value={toTitle(cloak.seasons)} /> : null,
    cloak.season_category ? (
      <MetaRow
        key="season-category"
        label="Season Category"
        value={toTitle(cloak.season_category)}
      />
    ) : null,
    cloak.location ? (
      <MetaRow key="location" label="Location" value={toTitle(cloak.location)} />
    ) : null,
    cloak.outfitSet ? (
      <Fragment key="outfit">
        <Typography variant="body2">Outfit</Typography>
        <Button component={Link} href={`/outfits/${cloak.outfitSet.slug}`} size="small">
          {cloak.outfitSet.title}
        </Button>
      </Fragment>
    ) : null,
  ].filter((row): row is React.ReactElement => row !== null)

  return (
    <SetDetailCard
      description={cloak.description}
      extraRows={extraRows}
      isLoggedIn={isLoggedIn}
      media={
        <LazyImage
          image={cloak.image_url ?? ''}
          kind="media"
          sx={{ width: '100%', maxWidth: 320, aspectRatio: '2 / 3' }}
          title={cloak.title}
        />
      }
      obtained={isObtained ? 1 : 0}
      rarity={cloak.rarity ?? 0}
      title={cloak.title}
      total={1}
    />
  )
}
