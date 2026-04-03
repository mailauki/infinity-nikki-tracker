'use client'
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import { RecentObtained } from '@/lib/types/eureka'
import { toTitle, formatDate } from '@/lib/utils'

export default function RecentUpdates({ items }: { items: RecentObtained[] }) {
  if (!items?.length) return null

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Recently Updated
          </Typography>
        }
      />
      <CardContent>
        <List disablePadding>
          {items.map((item) => (
            <ListItem key={item.id} disableGutters>
              <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                <LazyAvatar
                  alt={item.eureka_sets?.title}
                  size="md"
                  src={
                    item.eureka_sets?.eureka_variants.find(
                      (v) => v.category === item.category && v.color === item.color
                    )?.image_url ?? undefined
                  }
                />
              </ListItemAvatar>
              <ListItemText
                primary={item.eureka_sets?.title ?? toTitle(item.eureka_set ?? '')}
                secondary={[item.categories?.title, item.colors?.title].filter(Boolean).join(' • ')}
                slotProps={{
                  primary: { variant: 'body2' },
                  secondary: { variant: 'caption' },
                }}
              />
              <Typography color="text.secondary" variant="caption">
                {formatDate(item.created_at)}
              </Typography>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
