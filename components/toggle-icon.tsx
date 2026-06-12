'use client'
import { AvatarSize } from '@/lib/types/props'
import { useColorScheme } from '@mui/material'
import { useEffect, useState } from 'react'
import LazyImage from '@/components/lazy-image'
import { Category as CategoryIcon } from '@mui/icons-material'

interface ToggleItem {
  title: string
  image?: string
  image_url?: string | null
}

export default function ToggleIcon({
  item,
  isSelected = false,
  disabled,
  size = 'sm',
}: {
  item: ToggleItem
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

  return (
    <LazyImage
      alt={item.title}
      size={size}
      src={item.image ?? item.image_url ?? undefined}
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
