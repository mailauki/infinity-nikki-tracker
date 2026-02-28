import { Category, Eureka } from '@/lib/types/types'
import { List, ListSubheader } from '@mui/material'
import { ProgressItem } from './progress-item'

export default function ProgressList({
  items,
  eureka,
  filter,
  value,
  onValueChange,
}: {
  items: Category[]
  eureka: Eureka[]
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
          eureka={eureka}
          filter={filter}
          value={value}
          onValueChange={onValueChange}
        />
      ))}
    </List>
  )
}
