'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { Card, CardActionArea, useMediaQuery, useTheme } from '@mui/material'
import EurekaCard from './eureka-card'
import { CardSize, ResponsiveCardSize } from '@/lib/types/props'

function resolveCardSize(
  size: ResponsiveCardSize,
  breakpoints: { isXs: boolean; isSm: boolean; isMd: boolean }
): CardSize {
  if (typeof size === 'string') return size
  const { isXs, isSm, isMd } = breakpoints
  if (isXs) return size.xs ?? size.sm ?? size.md ?? size.lg ?? 'md'
  if (isSm) return size.sm ?? size.md ?? size.lg ?? 'md'
  if (isMd) return size.md ?? size.lg ?? 'md'
  return size.lg ?? 'md'
}

export default function EurekaSetCard({
  eurekaSet,
  isLoggedIn,
  size = { xs: 'sm', md: 'md' },
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  size?: ResponsiveCardSize
}) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.only('xs'))
  const isSm = useMediaQuery(theme.breakpoints.only('sm'))
  const isMd = useMediaQuery(theme.breakpoints.only('md'))
  const resolvedSize = resolveCardSize(size, { isXs, isSm, isMd })

  return (
    <Card>
      <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
        <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size={resolvedSize} />
      </CardActionArea>
    </Card>
  )
}
