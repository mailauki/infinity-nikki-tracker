import { Fragment } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import { Edit } from '@mui/icons-material'
import { Category } from '@mui/icons-material'
import LazyAvatar from '@/components/lazy-avatar'
import { RecentAdminItem } from '@/hooks/data/admin/recently'
import { formatDate } from '@/lib/utils'

export default function DashboardList({
  title,
  items,
}: {
  title: string
  items: RecentAdminItem[]
}) {
  if (!items.length) return null

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List disablePadding>
          {items.map((item, i) => (
            <Fragment key={`${item.type}-${item.slug}`}>
              <ListItem
                secondaryAction={
                  <Tooltip title={`Edit ${item.title}`}>
                    <IconButton color="secondary" href={item.editHref} size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemAvatar>
                  <LazyAvatar
                    alt={item.slug}
                    src={item.image_url ?? undefined}
                    sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                  >
                    <Category fontSize="inherit" />
                  </LazyAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.title}
                  secondary={item.type}
                  slotProps={{
                    primary: { variant: 'body2' },
                    secondary: { variant: 'caption' },
                  }}
                />
                <ListItemText
                  disableTypography
                  secondary={
                    <Typography color="text.secondary" variant="caption">
                      {formatDate(item.date)}
                    </Typography>
                  }
                  sx={{ textAlign: 'right', mr: 2 }}
                />
              </ListItem>
              {i < items.length - 1 && (
                <Divider component="li" sx={{ mr: 2 }} variant="inset" />
              )}
            </Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
