'use client'

import { useMemo } from 'react'
import { Alert } from '@mui/material'

import CardGrid from '@/components/card-grid'
import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import SetCard from '@/components/set-card'
import { useSortOrder } from '@/components/sort-context'

import { useMomoCloakData } from './momo-cloak-context'
import { CLOAK_SORT_AXES } from './momo-cloak-filter-menu'
import { useVisibleCloaks } from './use-visible-cloaks'

export default function FilterMomoCloaks() {
  const { obtainedSlugs, isLoggedIn, isObtainedError, isError, onToggleObtained } =
    useMomoCloakData()
  const { mode } = useOutfitImageMode()
  const { sortAxis, sortDir } = useSortOrder()
  // The sort axis is shared across domains, so it can arrive as 'progress' from
  // the outfits page. Cloaks don't offer that axis (obtained is a boolean here),
  // so fall back to date rather than leaving the grid on an axis with no button.
  const axis = CLOAK_SORT_AXES.includes(sortAxis) ? sortAxis : 'date'

  // Same hook the results bar uses, so the count can't drift from the grid.
  const visible = useVisibleCloaks()

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
          {/* The result count and collection progress live in the sticky bar
              (momo-cloak-results-bar.tsx), matching the outfits page. */}
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
