'use client'

import { IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { Clear } from '@mui/icons-material'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { isGlowup, matchesOutfitFilter } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import StickyBar from '@/components/navbar/sticky-bar'
import OutfitFilterMenu from './outfit-filter-menu'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitToggleBar({
  outfitSet,
  isStandalone = false,
  selected,
  onSelect,
  selectedSeason,
  onSelectSeason,
  selectedSeasonCategory,
  onSelectSeasonCategory,
  onClearFilters,
  isLoggedIn,
  obtained,
  total,
}: {
  outfitSet: OutfitSet
  isStandalone?: boolean
  selected: string | null
  onSelect: (next: string | null) => void
  selectedSeason: string | null
  onSelectSeason: (next: string | null) => void
  selectedSeasonCategory: string | null
  onSelectSeasonCategory: (next: string | null) => void
  onClearFilters: () => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  const { seasons, seasonCategories, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants } = outfitSet
  const baseSlug = outfitSet.slug

  // Each menu lists only values present on this set's variants, narrowed to what
  // the *other* two axes currently allow so no option ever leads to an empty
  // grid. Nulling the axis being built drops it from its own narrowing.
  const matchesExcept = (v: OutfitVariant, except: 'category' | 'season' | 'seasonCategory') =>
    matchesOutfitFilter(v, {
      isStandalone: true,
      selected: except === 'category' ? null : selected,
      selectedSeason: except === 'season' ? null : selectedSeason,
      selectedSeasonCategory: except === 'seasonCategory' ? null : selectedSeasonCategory,
    })

  const categoryOptions = outfitCategories
    .filter((c) =>
      outfit_variants.some((v) => v.outfit_category === c.slug && matchesExcept(v, 'category'))
    )
    .map((c) => ({ value: c.slug, label: c.title }))

  const seasonOptions = seasons
    .filter((s) => outfit_variants.some((v) => v.seasons === s.slug && matchesExcept(v, 'season')))
    .map((s) => ({ value: s.slug, label: s.title }))

  const hasActiveFilters = Boolean(selected || selectedSeason || selectedSeasonCategory)

  const seasonCategoryOptions = seasonCategories
    .filter((sc) =>
      outfit_variants.some(
        (v) => v.season_category === sc.slug && matchesExcept(v, 'seasonCategory')
      )
    )
    .map((sc) => ({ value: sc.slug, label: sc.title }))

  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flexGrow: 1, alignItems: 'flex-end', justifyContent: 'space-between', py: 1 }}
      >
        {isStandalone ? (
          <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: 'wrap', py: 0.1 }}>
            <OutfitFilterMenu
              allLabel="All Categories"
              label="Category"
              options={categoryOptions}
              value={selected}
              onSelect={onSelect}
            />
            <OutfitFilterMenu
              allLabel="All Seasons"
              label="Season"
              options={seasonOptions}
              value={selectedSeason}
              onSelect={onSelectSeason}
            />
            <OutfitFilterMenu
              allLabel="All Season Categories"
              label="Season Category"
              options={seasonCategoryOptions}
              value={selectedSeasonCategory}
              onSelect={onSelectSeasonCategory}
            />
            {hasActiveFilters && (
              <Tooltip title="Clear all">
                <IconButton
                  size="small"
                  sx={{ backdropFilter: 'blur(8px)' }}
                  onClick={onClearFilters}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ) : (
          <ToggleButtonGroup
            exclusive
            disabled={!selected && evolutions.length === 0}
            size="small"
            sx={{ flexWrap: 'wrap' }}
            value={selected}
            onChange={(_, next) => onSelect(next)}
          >
            {[null, ...evolutions].map((evolution) => {
              const value = evolution?.slug ?? baseSlug
              const glowup = !!evolution && isGlowup(evolution)
              return (
                <ToggleButton key={value} sx={{ backdropFilter: 'blur(8px)' }} value={value}>
                  {glowup && '✦ '}
                  {/* Sits beside "Base" under the set's own heading — short name only. */}
                  {evolution ? (evolution.subtitle ?? evolution.title) : 'Base'}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )}
        {isLoggedIn && (
          <Stack sx={{ py: 0.6 }}>
            <ProgressChip obtained={obtained} total={total} variant="parts" />
          </Stack>
        )}
      </Stack>
    </StickyBar>
  )
}
