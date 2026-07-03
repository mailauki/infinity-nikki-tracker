'use client'
import { AvatarSize } from '@/lib/types/props'
import { useColorScheme } from '@mui/material'
import { useEffect, useState } from 'react'
import LazyImage from '@/components/lazy-image'
import { Category as CategoryIcon } from '@mui/icons-material'
import { categoryIconSrc } from '@/lib/look-utils'
import { toTitle } from '@/lib/utils'

export default function ToggleIcon({
  category,
  title,
  image,
  imageUrl,
  isSelected = false,
  disabled,
  size = 'sm',
}: {
  // When set, the title and icon are derived from the category slug.
  category?: string
  // Otherwise pass a fixed icon directly (e.g. glowup/evolution/nav tabs).
  title?: string
  image?: string
  imageUrl?: string | null
  isSelected?: boolean
  disabled?: boolean
  size?: AvatarSize
}) {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const brightness = isDarkMode || isSelected ? null : 'brightness(40%)'
  const opacity = disabled ? 'opacity(0.3)' : null
  const filter = [brightness, opacity].filter(Boolean).join(' ') || 'none'

  const resolvedTitle = category ? toTitle(category) : (title ?? '')
  const resolvedSrc = category ? categoryIconSrc(category) : (image ?? imageUrl ?? undefined)

  return (
    <LazyImage
      alt={resolvedTitle}
      size={size}
      src={resolvedSrc}
      sx={{
        backgroundColor: 'transparent',
        filter,
        '&:hover': { filter: isDarkMode || isSelected ? 'none' : 'brightness(40%)' },
      }}
      variant="rounded"
    >
      <CategoryIcon sx={{ color: 'divider' }} />
    </LazyImage>
  )
}
