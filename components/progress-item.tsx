'use client'

import { countObtained, percent } from '@/hooks/count'
import { Category, EurekaVariant } from '@/lib/types/types'
import {
  Avatar,
  Chip,
  LinearProgress,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  useColorScheme,
} from '@mui/material'
import { Palette as PaletteIcon, Category as CategoryIcon } from '@mui/icons-material'
import Image from 'next/image'

export function ProgressItem({
  item,
  eurekaVariants,
  filter,
  value,
  onValueChange,
}: {
  item: Category
  eurekaVariants: EurekaVariant[]
  filter?: 'colors' | 'categories'
  value?: string
  onValueChange?: (value: string) => void
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  const filteredVariants = eurekaVariants.filter(
    (variant) => (filter === 'colors' ? variant.color : variant.category) === item.name
  )
  const obtainedCount = countObtained(filter ? filteredVariants : eurekaVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)
  const isSelected = value === item.name

  return (
    <>
      <ListItem
        disablePadding={!!onValueChange}
        secondaryAction={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
      >
        {!!onValueChange ? (
          <ListItemButton
            selected={isSelected}
            onClick={() => onValueChange?.(isSelected ? '' : item.name)}
          >
            <ListItemAvatar>
              <Avatar
                alt={item.name}
                sx={{
                  bgcolor: 'transparent',
                  ...(filter === 'categories' && { filter: isDarkMode ? 'none' : 'brightness(40%)' }),
                }}
              >
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} width={100} height={100} />
                ) : (
                  <CategoryIcon />
                )}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={item.name} secondary={`${percentage}%`} />
          </ListItemButton>
        ) : (
          <>
            <ListItemAvatar>
              <Avatar
                alt={item.name}
                sx={{
                  bgcolor: 'transparent',
                  ...(filter === 'categories' && { filter: isDarkMode ? 'none' : 'brightness(40%)' }),
                }}
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={filter === 'colors' ? 20 : 100}
                    height={filter === 'colors' ? 20 : 100}
                  />
                ) : (
                  <PaletteIcon />
                )}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={item.name} secondary={`${percentage}%`} />
          </>
        )}
      </ListItem>
      <ListItem disablePadding>
        <ListItemText inset>
          <LinearProgress value={percentage} variant="determinate" color="inherit" sx={{ mx: 2 }} />
        </ListItemText>
      </ListItem>
    </>
  )
}
