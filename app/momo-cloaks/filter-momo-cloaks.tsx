'use client'

import { useMemo } from 'react'
import { Alert, Stack, Typography } from '@mui/material'

import CardGrid from '@/components/card-grid'
import LoginAlert from '@/components/login-alert'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

import { useMomoCloakData } from './momo-cloak-context'

export default function FilterMomoCloaks() {
  const { cloaks, obtainedSlugs, isLoggedIn, isObtainedError, filters } = useMomoCloakData()
  const { onToggleObtained } = useMomoCloakData()
  const { selectedRarity, selectedSeason, selectedSeasonCategory, selectedObtainedFilter } = filters

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
      selectedObtainedFilter,
    ]
  )

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
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 1 }}
      >
        <Typography variant="body2">
          {visible.length} of {cloaks.length} cloaks
        </Typography>
        {isLoggedIn && !isObtainedError && (
          <ProgressChip obtained={obtainedCount} size="md" total={cloaks.length} />
        )}
      </Stack>
      {visible.length === 0 ? (
        <Alert severity="info">No cloaks match these filters.</Alert>
      ) : (
        <CardGrid columns="outfit">
          {visible.map((cloak) => {
            const isObtained = obtainedSlugs.has(cloak.slug)
            return (
              <SetCard
                key={cloak.slug}
                in
                href={`/momo-cloaks/${cloak.slug}`}
                imageSrc={cloak.image_url ?? ''}
                isLoggedIn={isLoggedIn && !isObtainedError}
                obtained={isObtained ? 1 : 0}
                rarity={cloak.rarity ?? 0}
                showAlt={false}
                title={cloak.title}
                total={1}
                onToggle={() => onToggleObtained(cloak.slug)}
              />
            )
          })}
        </CardGrid>
      )}
    </>
  )
}
