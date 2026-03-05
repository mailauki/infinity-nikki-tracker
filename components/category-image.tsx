'use client'
import Image from 'next/image'
import { Avatar, CardHeader, useColorScheme } from '@mui/material'
import { AvatarSize } from '@/lib/types/types'

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
      avatar={
        <Avatar
          sx={{
            bgcolor: 'transparent',
            filter: isDarkMode || size === 'xs' ? 'none' : 'brightness(40%)',
          }}
          size={size}
        >
          <Image src={imageUrl} alt={alt} width={100} height={100} />
        </Avatar>
      }
      title={title}
      subheader={subheader}
      action={action}
      sx={{ width: '100%' }}
    />
  )
}
