'use client'
import { CardHeader, useColorScheme } from '@mui/material'
import { AvatarSize } from '@/lib/types/props'
import LazyAvatar from './lazy-avatar'

export default function CategoryImage({
  imageUrl,
  alt,
  action,
  size,
  title,
  subheader,
}: {
  imageUrl: string
  alt: string
  action?: React.ReactNode
  size?: AvatarSize
  title?: string
  subheader?: string
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <CardHeader
      action={action}
      avatar={
        <LazyAvatar
          alt={alt}
          size={size}
          src={imageUrl}
          sx={{
            bgcolor: 'transparent',
            filter: isDarkMode || size === 'xs' ? 'none' : 'brightness(40%)',
          }}
        />
      }
      subheader={subheader}
      sx={{ width: '100%' }}
      title={title}
    />
  )
}
