import { count, percent } from '@/hooks/count'
import { Category, Eureka } from '@/lib/types/types'
import { ListItem, Chip, ListItemAvatar, Avatar, ListItemText, LinearProgress } from '@mui/material'
import { Palette as PaletteIcon, Category as CategoryIcon } from '@mui/icons-material'

export function ProgressItem({
  item,
  eureka,
  filter,
}: {
  item: Category
  eureka: Eureka[]
  filter?: 'colors' | 'categories'
}) {
  const filteredEureka = eureka.filter(
    (eureka) => (filter === 'colors' ? eureka.color : eureka.category) === item.name
  )
  const obtainedCount = count(filter ? filteredEureka : eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <ListItem
        secondaryAction={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
      >
        <ListItemAvatar>
          <Avatar alt={item.name}>
            {filter === 'colors' ? <PaletteIcon /> : <CategoryIcon />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={item.name} secondary={`${percentage}%`} />
      </ListItem>
      <ListItem disablePadding>
        <ListItemText inset>
          <LinearProgress value={percentage} variant="determinate" color="inherit" sx={{ mx: 2 }} />
        </ListItemText>
      </ListItem>
    </>
  )
}
