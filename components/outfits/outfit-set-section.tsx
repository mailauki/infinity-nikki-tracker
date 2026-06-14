'use client'

import { Fragment } from 'react'
import { ChevronRight, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Box, Button, Chip, Divider, IconButton, Stack } from '@mui/material'
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
  const { filters, outfitSets, onBatchToggleObtained } = useOutfitData()
  const isMissingFilter = filters.selectedObtainedFilter === 'missing'

  // `set.outfit_variants` is already filtered (e.g. the missing filter culls
  // obtained variants), so the progress chip must read the full, unfiltered
  // group from context to show the true obtained-out-of-total percentage.
  const fullSet = outfitSets.find((s) => s.id === set.id) ?? set

  // Base variants carry the concrete {set}-base slug end-to-end.
  const baseEvoSlug = `${set.slug}-base`

  // Render the base group plus each evolution group as its own header + cards.
  return [null, ...set.evolutions]
    .map((evolution) => {
      const evolutionKey = evolution?.slug ?? baseEvoSlug
      const inEvolution = (v: { evolution: string | null }) => v.evolution === evolutionKey
      const variants = set.outfit_variants.filter(inEvolution)
      if (variants.length === 0) return null

      const href = evolution
        ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
        : `/outfits/${set.slug}`
      const title = evolution
        ? `${set.title}: ${toTitle(evolution.subtitle ?? evolution.slug)}`
        : set.title

      const groupVariants = fullSet.outfit_variants.filter(inEvolution)
      const obtained = groupVariants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
      const allObtained = groupVariants.length > 0 && obtained === groupVariants.length

      // Batch-toggle the whole evolution group: when fully obtained, clear it;
      // otherwise mark the remaining (not-yet-obtained) variants obtained.
      const handleToggle = () => {
        const toToggle = groupVariants
          .filter((v) => !!v.obtained === allObtained)
          .map((v) => ({
            outfit_set: v.outfit_set!,
            outfit_category: v.outfit_category!,
            evolution: v.evolution,
          }))
        onBatchToggleObtained(toToggle, !allObtained)
      }

      return (
        <Fragment key={evolutionKey}>
          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Stack
              direction="row"
              sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <Button color="inherit" endIcon={<ChevronRight />} href={href} size="small">
                {title}
              </Button>
              {isLoggedIn && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    label={`${obtained} / ${groupVariants.length}`}
                    size="small"
                    variant="outlined"
                  />
                  <ProgressChip percentage={percent(obtained, groupVariants.length)} size="lg" />
                  <IconButton
                    aria-label={allObtained ? 'Mark as not obtained' : 'Mark as obtained'}
                    size="small"
                    onClick={handleToggle}
                  >
                    {allObtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
                  </IconButton>
                </Stack>
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
