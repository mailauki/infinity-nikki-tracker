'use client'

import { useMemo } from 'react'
import { Alert, Stack, Typography } from '@mui/material'

import CardGrid from '@/components/card-grid'
import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'
import { useSortOrder } from '@/components/sort-context'

import { useMomoCloakData } from './momo-cloak-context'
import { CLOAK_SORT_AXES } from './momo-cloak-filter-menu'

export default function FilterMomoCloaks() {
  const { cloaks, obtainedSlugs, isLoggedIn, isObtainedError, isError, filters, onToggleObtained } =
    useMomoCloakData()
  const { mode } = useOutfitImageMode()
  const { sortAxis, sortDir } = useSortOrder()
  // The sort axis is shared across domains, so it can arrive as 'progress' from
  // the outfits page. Cloaks don't offer that axis (obtained is a boolean here),
  // so fall back to date rather than leaving the grid on an axis with no button.
  const axis = CLOAK_SORT_AXES.includes(sortAxis) ? sortAxis : 'date'
  const {
    selectedRarity,
    selectedSeason,
    selectedSeasonCategory,
    selectedLocation,
    selectedObtainedFilter,
  } = filters

  const visible = useMemo(
    () =>
      cloaks.filter((cloak) => {
        if (selectedRarity !== null && cloak.rarity !== selectedRarity) return false
        if (selectedSeason.length > 0 && !selectedSeason.includes(cloak.seasons ?? '')) return false
        if (
          selectedSeasonCategory.length > 0 &&
          !selectedSeasonCategory.includes(cloak.season_category ?? '')
        )
          return false
        if (selectedLocation !== null && cloak.location !== selectedLocation) return false
        // The obtained filter is meaningless logged out — every cloak reads as
        // not-obtained — so it only applies for signed-in users.
        if (isLoggedIn && selectedObtainedFilter) {
          const isObtained = obtainedSlugs.has(cloak.slug)
          if (selectedObtainedFilter === 'obtained' && !isObtained) return false
          if (selectedObtainedFilter === 'missing' && isObtained) return false
        }
        return true
      }),
    [
      cloaks,
      obtainedSlugs,
      isLoggedIn,
      selectedRarity,
      selectedSeason,
      selectedSeasonCategory,
      selectedLocation,
      selectedObtainedFilter,
    ]
  )

  // Mirrors the outfits comparator, minus `progress` — a cloak is a single unit,
  // so obtained is a boolean and that axis would only replay the obtained filter.
  // `date` sorts on id: created_at holds bulk-import timestamps, so id is the
  // same ordering without parsing a date on every comparison.
  const sorted = useMemo(() => {
    // Collapse runs of whitespace before comparing. A stray double space (the
    // stored titles have had one) sorts before every letter, which would drag
    // that cloak to the front of an alphabetical sort for a reason invisible
    // on screen.
    const sortKey = (title: string) => title.replace(/\s+/g, ' ').trim()

    return [...visible].sort((a, b) => {
      let cmp: number
      switch (axis) {
        case 'rarity':
          cmp = (a.rarity ?? 0) - (b.rarity ?? 0)
          break
        case 'title':
          cmp = sortKey(a.title).localeCompare(sortKey(b.title))
          break
        default:
          cmp = a.id - b.id
      }
      // `desc` is the default direction for date/rarity (newest / highest
      // first); for title, `asc` is A→Z. Stable tiebreak on id.
      return (sortDir === 'asc' ? cmp : -cmp) || a.id - b.id
    })
  }, [visible, axis, sortDir])

  const obtainedCount = useMemo(
    () => cloaks.filter((c) => obtainedSlugs.has(c.slug)).length,
    [cloaks, obtainedSlugs]
  )

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      {isObtainedError && (
        <Alert severity="warning">
          We couldn&apos;t load your collection. Cloaks are shown, but tracking is unavailable.
        </Alert>
      )}
      {isError ? (
        <ErrorAlert message="We couldn't load momo cloaks. Please try again." />
      ) : (
        <>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 1 }}
          >
            <Typography variant="body2">
              {sorted.length} of {cloaks.length} cloaks
            </Typography>
            {isLoggedIn && !isObtainedError && (
              <ProgressChip obtained={obtainedCount} size="md" total={cloaks.length} />
            )}
          </Stack>
          {sorted.length === 0 ? (
            <Alert severity="info">No cloaks match these filters.</Alert>
          ) : (
            <CardGrid columns="outfit">
              {sorted.map((cloak) => {
                const isObtained = obtainedSlugs.has(cloak.slug)
                return (
                  <SetCard
                    key={cloak.slug}
                    in
                    href={`/momo-cloaks/${cloak.slug}`}
                    imageSrc={
                      resolveOutfitImage(mode, {
                        image: cloak.image_url,
                        alt: cloak.alt_image_url,
                      }) ?? ''
                    }
                    isLoggedIn={isLoggedIn && !isObtainedError}
                    obtained={isObtained ? 1 : 0}
                    rarity={cloak.rarity ?? 0}
                    showAlt={mode === 'alt'}
                    title={cloak.title}
                    total={1}
                    onToggle={() => onToggleObtained(cloak.slug)}
                  />
                )
              })}
            </CardGrid>
          )}
        </>
      )}
    </>
  )
}
