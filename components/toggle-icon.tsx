'use client'
import { AvatarSize, NavLink } from '@/lib/types/props'
import { useColorScheme } from '@mui/material'
import { useEffect, useState } from 'react'
import LazyAvatar from './lazy-avatar'
import { Category as CategoryIcon } from '@mui/icons-material'
import { EurekaCategory } from '@/lib/types/eureka'

export default function ToggleIcon({
  item,
  isSelected,
  disabled,
  size = 'sm',
}: {
  item: NavLink | EurekaCategory
  isSelected: boolean
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
    <LazyAvatar
      alt={item.title}
      size={size}
      src={item.image_url || item.image}
      sx={{
        backgroundColor: 'transparent',
        filter,
        '&:hover': { filter: isDarkMode || isSelected ? 'none' : 'brightness(40%)' },
      }}
      variant="rounded"
    >
      <CategoryIcon sx={{ color: 'divider' }} />
    </LazyAvatar>
  )
}
