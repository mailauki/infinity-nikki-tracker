import { Category, EurekaVariant } from '@/lib/types/types'
import { List, ListSubheader } from '@mui/material'
import { ProgressItem } from './progress-item'

export default function ProgressList({
  items,
  eurekaVariants,
  filter,
  value,
  onValueChange,
}: {
  items: Category[]
  eurekaVariants: EurekaVariant[]
  filter?: 'colors' | 'categories'
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <List
      sx={{ width: '100%' }}
      subheader={
        <ListSubheader disableSticky sx={{ textTransform: 'capitalize' }}>
          {filter}
        </ListSubheader>
      }
    >
      {items.map((item) => (
        <ProgressItem
          key={item.name}
          item={item}
          eurekaVariants={eurekaVariants}
          filter={filter}
          value={value}
          onValueChange={onValueChange}
        />
      ))}
    </List>
  )
}
