import { count, percent } from '@/hooks/count'
import { Category, Eureka } from '@/lib/types/types'
import {
  Avatar,
  Chip,
  LinearProgress,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { Palette as PaletteIcon, Category as CategoryIcon } from '@mui/icons-material'
import Image from 'next/image'

export function ProgressItem({
  item,
  eureka,
  filter,
  value,
  onValueChange,
}: {
  item: Category
  eureka: Eureka[]
  filter?: 'colors' | 'categories'
  value?: string
  onValueChange?: (value: string) => void
}) {
  const filteredEureka = eureka.filter(
    (eureka) => (filter === 'colors' ? eureka.color : eureka.category) === item.name
  )
  const obtainedCount = count(filter ? filteredEureka : eureka)
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
              <Avatar alt={item.name} sx={{ bgcolor: 'transparent' }}>
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
              <Avatar alt={item.name} sx={{ bgcolor: 'transparent' }}>
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
