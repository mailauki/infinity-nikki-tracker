import LazyAvatar from '@/components/eureka/lazy-avatar'
import { EurekaSet, EurekaVariantRaw, Trial } from '@/lib/types/eureka'
import { formatDate, toTitle } from '@/lib/utils'
import { Category, Edit } from '@mui/icons-material'
import {
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'

export default function DashboardList({
  items,
}: {
  items: EurekaSet[] | EurekaVariantRaw[] | Trial[]
}) {
  const editHref = ''
  return (
    <List>
      {items.map((item) => (
        <ListItem
          key={item.id}
          secondaryAction={
            <Tooltip title={`Edit ${'title' in item ? item.title : item.eureka_set}`}>
              <IconButton color="secondary" href={editHref}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemAvatar>
            <LazyAvatar
              alt={item.slug}
              src={item.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          </ListItemAvatar>
          <ListItemText
            primary={'title' in item ? item.title : item.eureka_set}
            secondary={
              'description' in item
                ? item.description
                : [toTitle(item.category!), toTitle(item.color!)].filter(Boolean).join(' • ') ||
                  undefined
            }
          />

          <ListItemText
            disableTypography
            secondary={
              <Typography variant="caption">
                {item.updated_at ? formatDate(item.updated_at) : '—'}
              </Typography>
            }
            sx={{ textAlign: 'right', mr: 2 }}
          />
        </ListItem>
      ))}
    </List>
  )
}
