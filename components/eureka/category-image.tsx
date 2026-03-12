'use client'
import Image from 'next/image'
import { Avatar, CardHeader, useColorScheme } from '@mui/material'
import { AvatarSize } from '@/lib/types/props'

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
        <Avatar
          size={size}
          sx={{
            bgcolor: 'transparent',
            filter: isDarkMode || size === 'xs' ? 'none' : 'brightness(40%)',
          }}
        >
          <Image alt={alt} height={100} src={imageUrl} width={100} />
        </Avatar>
      }
      subheader={subheader}
      sx={{ width: '100%' }}
      title={title}
    />
  )
}
