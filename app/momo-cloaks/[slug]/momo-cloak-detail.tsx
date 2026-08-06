'use client'

import Link from 'next/link'
import { Button, Stack, Typography } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'
import { MomoCloak } from '@/lib/types/momo'
import { toTitle } from '@/lib/utils'

import { useMomoCloakData } from '../momo-cloak-context'

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
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
      <Stack key="outfit" direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography variant="body2">Outfit</Typography>
        <Button component={Link} href={`/outfits/${cloak.outfitSet.slug}`} size="small">
          {cloak.outfitSet.title}
        </Button>
      </Stack>
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
