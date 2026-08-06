'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Link as Anchor, Button, Typography } from '@mui/material'

import LazyImage from '@/components/lazy-image'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
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

export default function MomoCloakDetail({
  cloak,
  isAdmin,
}: {
  cloak: MomoCloak
  isAdmin: boolean
}) {
  const { obtainedSlugs, isLoggedIn } = useMomoCloakData()
  const { mode } = useOutfitImageMode()
  const isObtained = obtainedSlugs.has(cloak.slug)

  const extraRows = [
    // The season links through to its own page; every cloak season slug resolves
    // to a real `seasons` row, so the link is never dead.
    cloak.seasons ? (
      <Fragment key="season">
        <Typography variant="body2">Season</Typography>
        <Anchor
          component={Link}
          href={`/outfits/seasons/${cloak.seasons}`}
          sx={{ cursor: 'pointer' }}
          underline="hover"
          variant="body2"
        >
          {toTitle(cloak.seasons)}
        </Anchor>
      </Fragment>
    ) : null,
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
        title={cloak.title}
        total={1}
      />
    </>
  )
}
