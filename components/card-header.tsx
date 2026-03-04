'use client'

import {
  Avatar,
  CardContent,
  Chip,
  LinearProgress,
  CardHeader as MuiCardHeader,
  useColorScheme,
} from '@mui/material'
import { Palette as PaletteIcon, Category as CategoryIcon } from '@mui/icons-material'
import { CategoryType } from '@/lib/types/types'
import Image from 'next/image'

export default function CardHeader({
  image,
  title,
  subheader,
  chip,
  categoryType,
  percentage,
}: {
  image: string | null
  title: string
  subheader: string
  chip: string
  categoryType: CategoryType
  percentage: number
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'
  const FallbackIcon = categoryType === 'colors' ? PaletteIcon : CategoryIcon

  return (
    <>
      <MuiCardHeader
        avatar={
          <Avatar
            alt={title}
            sx={{
              bgcolor: 'transparent',
              ...(categoryType === 'categories' && {
                filter: isDarkMode ? 'none' : 'brightness(40%)',
              }),
            }}
          >
            {image ? (
              <Image
                src={image}
                alt={title}
                width={categoryType === 'colors' ? 20 : 100}
                height={categoryType === 'colors' ? 20 : 100}
              />
            ) : (
              <FallbackIcon />
            )}
          </Avatar>
        }
        title={title}
        subheader={subheader}
        action={<Chip label={chip} variant="outlined" size="small" />}
        sx={{ width: '100%' }}
      />
      <CardContent sx={{ pt: 0 }}>
        <LinearProgress value={percentage} variant="determinate" color="inherit" />
      </CardContent>
    </>
  )
}
