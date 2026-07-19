'use client'

import { Stack, Typography, Chip, CardContent } from '@mui/material'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'

export interface SetDetailCardProps {
  /** Set title, shown as the card heading. */
  title: string
  /** Optional suffix appended to the title (e.g. a selected evolution name). */
  titleSuffix?: string | null
  rarity: number
  /** Style label shown opposite the progress chip. */
  style?: string | null
  /** Primary/secondary labels rendered as outlined chips beside the rarity. */
  labels?: (string | null | undefined)[]
  description?: string | null
  /** Progress numerator/denominator across the whole set. */
  obtained: number
  total: number
  isLoggedIn: boolean
  /** Media block (image or gallery) rendered above the metadata. */
  media?: React.ReactNode
  /**
   * Domain-specific rows rendered between the style/progress row and the
   * description — e.g. the outfit ability + gallery toggle, or the eureka
   * trials link. Each entry becomes its own space-between row.
   */
  extraRows?: React.ReactNode[]
}

// Domain-agnostic set-detail card body used inside a slug page's SidebarBody by
// both Outfits and Eureka. It owns only the shared shape — media on top, then
// title, rarity + labels, style + progress, any domain rows, and the
// description. Everything domain-specific (evolutions, seasons, trials, colors)
// is supplied by the caller via `media` and `extraRows`.
export default function SetDetailCard({
  title,
  titleSuffix,
  rarity,
  style,
  labels = [],
  description,
  obtained,
  total,
  isLoggedIn,
  media,
  extraRows = [],
}: SetDetailCardProps) {
  const visibleLabels = labels.filter((label): label is string => !!label)

  return (
    <>
      {media && (
        <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
          {media}
        </Stack>
      )}
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">
            {title}
            {titleSuffix && `: ${titleSuffix}`}
          </Typography>
          <Stack
            direction="row"
            sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <RarityStars rarity={rarity} />
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {visibleLabels.map((label) => (
                <Chip key={label} label={toTitle(label)} variant="outlined" />
              ))}
            </Stack>
          </Stack>
          <Stack
            direction="row"
            sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography color="textSecondary" variant="body1">
              {toTitle(style ?? '')}
            </Typography>
            {isLoggedIn && <ProgressChip obtained={obtained} size="md" total={total} />}
          </Stack>
          {extraRows.map((row, index) => (
            <Stack
              key={index}
              direction="row"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {row}
            </Stack>
          ))}
          {description && (
            <Typography sx={{ textWrap: 'wrap' }} variant="body2">
              {description}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </>
  )
}
