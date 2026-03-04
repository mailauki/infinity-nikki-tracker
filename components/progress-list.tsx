import { Category, CategoryType, EurekaVariant } from '@/lib/types/types'
import { List, ListSubheader } from '@mui/material'
import { ProgressItem } from './progress-item'

export default function ProgressList({
  items,
  eurekaVariants,
  categoryType = 'categories',
  value,
  onValueChange,
}: {
  items: Category[]
  eurekaVariants: EurekaVariant[]
  categoryType?: CategoryType
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <List
      sx={{ width: '100%' }}
      subheader={
        <ListSubheader disableSticky sx={{ textTransform: 'capitalize' }}>
          {categoryType}
        </ListSubheader>
      }
    >
      {items.map((item) => (
        <ProgressItem
          key={item.name}
          item={item}
          eurekaVariants={eurekaVariants}
          categoryType={categoryType}
          value={value}
          onValueChange={onValueChange}
        />
      ))}
    </List>
  )
}
