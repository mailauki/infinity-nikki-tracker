'use client'
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import LazyImage from '@/components/lazy-image'
import { RecentObtained } from '@/lib/types/eureka'
import { toTitle, formatDate, toSlug } from '@/lib/utils'

export default function EurekaRecentUpdates({ items }: { items: RecentObtained[] }) {
  if (!items?.length) return null

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" size="small" variant="label">
            Recently Obtained
          </Typography>
        }
      />
      <CardContent>
        <List disablePadding>
          {items.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton component="a" href={`/eureka/${toSlug(item.eureka_sets!.title!)}`}>
                <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                  <LazyImage
                    kind='avatar'
                    src={
                      item.eureka_sets?.eureka_variants.find(
                        (v) => v.category === item.category && v.color === item.color
                      )?.image_url ?? undefined
                    }
                    title={item.eureka_sets?.title ?? ''}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={item.eureka_sets?.title ?? toTitle(item.eureka_set ?? '')}
                  secondary={[item.eureka_categories?.title, item.eureka_colors?.title]
                    .filter(Boolean)
                    .join(' • ')}
                  slotProps={{
                    primary: { variant: 'body' },
                    secondary: { variant: 'body', size: 'small' },
                  }}
                />
                <Typography color="text.secondary" size="small" variant="body">
                  {formatDate(item.created_at)}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
