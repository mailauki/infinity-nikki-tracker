'use client'

import { Fragment } from 'react'
import { ChevronRight, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Box, Button, Divider, IconButton, Stack } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import ProgressChip from '@/components/progress-chip'
import { useOutfitData } from '@/components/outfits/outfit-context'
import OutfitVariantCard from './outfit-variant-card'

export default function OutfitSetSection({
  set,
  isLoggedIn,
}: {
  set: OutfitSet
  isLoggedIn: boolean
}) {
  const { outfitSets, onBatchToggleObtained } = useOutfitData()

  // `set.outfit_variants` is already filtered (e.g. the missing filter culls
  // obtained variants), so the progress chip must read the full, unfiltered
  // group from context to show the true obtained-out-of-total percentage.
  const fullSet = outfitSets.find((s) => s.id === set.id) ?? set

  // The base state slug is the set's own slug; each evolution has its own slug.
  const baseSlug = set.slug

  // Render the base group plus each evolution group as its own header + cards.
  return [null, ...set.evolutions]
    .map((evolution) => {
      const stateSlug = evolution?.slug ?? baseSlug
      const inState = (v: { outfit_set: string | null }) => v.outfit_set === stateSlug
      const variants = set.outfit_variants.filter(inState)
      if (variants.length === 0) return null

      const href = evolution
        ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
        : `/outfits/${set.slug}`
      const title = evolution ? `${set.title}: ${toTitle(evolution.title)}` : set.title

      const groupVariants = fullSet.outfit_variants.filter(inState)
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
            outfit_variant: v.slug,
          }))
        onBatchToggleObtained(toToggle, !allObtained)
      }

      return (
        <Fragment key={stateSlug}>
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
                  <ProgressChip obtained={obtained} total={groupVariants.length} variant="parts" />
                  <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                    <ProgressChip obtained={obtained} size="lg" total={groupVariants.length} />
                  </Box>
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
            // Within the grouped-by-set section, a toggled variant stays put
            // under its set header even under the missing filter — only the
            // flat (ungrouped) missing view culls obtained variants on toggle.
            <OutfitVariantCard key={variant.id} isLoggedIn={isLoggedIn} outfitVariant={variant} />
          ))}
        </Fragment>
      )
    })
    .filter(Boolean)
}
