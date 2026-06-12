'use client'

import { Fragment } from 'react'
import { ChevronRight } from '@mui/icons-material'
import { Box, Button, Divider, Stack } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import ProgressChip from '@/components/progress-chip'
import { useOutfitData } from './outfit-context'
import OutfitVariantCard from './outfit-variant-card'

export default function OutfitSetSection({
  set,
  isLoggedIn,
}: {
  set: OutfitSet
  isLoggedIn: boolean
}) {
  const { filters } = useOutfitData()
  const isMissingFilter = filters.selectedObtainedFilter === 'missing'

  // Render the base group plus each evolution group as its own header + cards.
  return [null, ...set.evolutions]
    .map((evolution) => {
      const evolutionKey = evolution?.slug ?? null
      const variants = set.outfit_variants.filter((v) =>
        evolutionKey === null ? v.evolution === null : v.evolution === evolutionKey
      )
      if (variants.length === 0) return null

      const href = evolution
        ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
        : `/outfits/${set.slug}`
      const title = evolution
        ? `${set.title}: ${toTitle(evolution.subtitle ?? evolution.slug)}`
        : set.title
      const obtained = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)

      return (
        <Fragment key={evolutionKey ?? 'base'}>
          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Stack
              direction="row"
              sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <Button color="inherit" endIcon={<ChevronRight />} href={href} size="small">
                {title}
              </Button>
              {isLoggedIn && (
                <ProgressChip percentage={percent(obtained, variants.length)} size="lg" />
              )}
            </Stack>
            <Divider />
          </Box>
          {variants.map((variant) => (
            <OutfitVariantCard
              key={variant.id}
              isLoggedIn={isLoggedIn}
              isMissingFilter={isMissingFilter}
              outfitVariant={variant}
            />
          ))}
        </Fragment>
      )
    })
    .filter(Boolean)
}
