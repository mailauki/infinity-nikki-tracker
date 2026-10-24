'use client'

import { useMemo } from 'react'
import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import StickyBar from '@/components/navbar/sticky-bar'
import { VirtualVariantGrid } from '@/components/virtual-grid'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSortOrder } from '@/components/sort-context'
import { compareRelease, resolveRelease } from '@/hooks/release'
import { STANDALONE_PIECES_SLUG } from '@/lib/variant-slug'
import { TRANSLUCENT_SURFACE } from '@/lib/theme'
import OutfitVariantCard from '../outfit-variant-card'
import OutfitsLoading from '../loading'

/**
 * Every standalone piece as its own card. Standalone pieces share one container
 * set but have nothing else in common, so — unlike the outfits grid, which
 * filters by set-level fields — every filter here reads the piece's own
 * rarity, style, labels, season and category. The set/evolution filters have
 * no meaning for single pieces and are ignored (FilterMenu hides them here).
 */
export default function StandalonePieces() {
  const {
    outfitSets,
    isLoggedIn,
    isLoading,
    isError,
    isObtainedError,
    isFiltering,
    hideGlowups,
    filters,
    exitingKeys,
  } = useOutfitData()
  const { sortAxis, sortDir } = useSortOrder()
  // Progress sorting needs obtained data; fall back to date when logged out.
  const axis = !isLoggedIn && sortAxis === 'progress' ? 'date' : sortAxis

  const {
    selectedOutfitCategory,
    selectedObtainedFilter,
    selectedRarity,
    selectedStyle,
    selectedLabel,
    selectedSeason,
    selectedSeasonCategory,
  } = filters

  const pieces = useMemo(() => {
    const all = outfitSets.find((s) => s.slug === STANDALONE_PIECES_SLUG)?.outfit_variants ?? []
    return all
      .filter((v) => !hideGlowups || !v.glowup_of)
      .filter((v) => !selectedRarity || v.rarity === selectedRarity)
      .filter((v) => !selectedStyle.length || selectedStyle.includes(v.style ?? ''))
      .filter(
        (v) => !selectedLabel.length || selectedLabel.some((l) => l === v.label || l === v.label_2)
      )
      .filter((v) => !selectedSeason.length || selectedSeason.includes(v.seasons ?? ''))
      .filter(
        (v) =>
          !selectedSeasonCategory.length || selectedSeasonCategory.includes(v.season_category ?? '')
      )
      .filter(
        (v) =>
          !selectedOutfitCategory.length ||
          (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
      )
      .filter((v) => {
        // Completed under "missing" and still animating out: keep it so the card
        // has something to animate (see useExitHold).
        if (exitingKeys.has(v.slug)) return true
        if (selectedObtainedFilter === 'obtained') return v.obtained === true
        if (selectedObtainedFilter === 'missing') return v.obtained !== true
        return true
      })
      .sort((a, b) => {
        if (axis === 'date') {
          // Same tie-break as the outfits grid: undated pieces tie on release, so
          // the id order has to follow sortDir too.
          return (
            compareRelease(resolveRelease(a), resolveRelease(b), sortDir) ||
            (sortDir === 'asc' ? a.id - b.id : b.id - a.id)
          )
        }
        let cmp: number
        switch (axis) {
          case 'rarity':
            cmp = (a.rarity ?? 0) - (b.rarity ?? 0)
            break
          case 'progress':
            cmp = Number(!!a.obtained) - Number(!!b.obtained)
            break
          default:
            cmp = (a.title ?? '').localeCompare(b.title ?? '')
        }
        return (sortDir === 'asc' ? cmp : -cmp) || a.id - b.id
      })
  }, [
    outfitSets,
    hideGlowups,
    selectedRarity,
    selectedStyle,
    selectedLabel,
    selectedSeason,
    selectedSeasonCategory,
    selectedOutfitCategory,
    selectedObtainedFilter,
    exitingKeys,
    axis,
    sortDir,
  ])

  if (isError) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <ErrorAlert message="Failed to load Outfits data. Please refresh the page." />
      </Box>
    )
  }

  if (isLoading) return <OutfitsLoading />

  return (
    <>
      <StickyBar>
        <Chip
          color="secondary"
          label={`Showing: ${pieces.length} results`}
          sx={{ backgroundColor: TRANSLUCENT_SURFACE, backdropFilter: 'blur(8px)' }}
          variant="outlined"
        />
      </StickyBar>

      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert title="Outfits" />
        </Box>
      )}

      {isObtainedError && (
        <Alert severity="warning" sx={{ width: 'fit-content', my: 2 }}>
          Could not load your collection status. Progress may be inaccurate.
        </Alert>
      )}

      {pieces.length === 0 ? (
        <Stack sx={{ py: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary" size="small" variant="headline">
            No results
          </Typography>
          <Typography color="textSecondary" variant="body">
            Try adjusting your filters
          </Typography>
        </Stack>
      ) : (
        <VirtualVariantGrid
          isFiltering={isFiltering}
          items={pieces}
          renderItem={(variant) => (
            <OutfitVariantCard
              key={variant.id}
              isLoggedIn={isLoggedIn}
              isMissingFilter={selectedObtainedFilter === 'missing'}
              outfitVariant={variant}
            />
          )}
        />
      )}
    </>
  )
}
