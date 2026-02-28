import { Category, Eureka } from '@/lib/types/types'
import { List, ListSubheader } from '@mui/material'
import { ProgressItem } from './progress-item'

export default function ProgressList({
  items,
  eureka,
  filter,
}: {
  items: Category[]
  eureka: Eureka[]
  filter?: 'colors' | 'categories'
}) {
  return (
    <List
      sx={{
        width: '100%',
        // minWidth: 300,
        // maxWidth: { xs: "100%", sm: "50%", md: 360 }
      }}
      subheader={
        <ListSubheader disableSticky sx={{ textTransform: 'capitalize' }}>
          {filter}
        </ListSubheader>
      }
    >
      {items.map((item) => (
        <ProgressItem key={item.name} item={item} eureka={eureka} filter={filter} />
      ))}
    </List>
  )
}
