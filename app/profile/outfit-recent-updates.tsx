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
import { RecentObtainedOutfit } from '@/lib/types/outfit'
import { toTitle, formatDate } from '@/lib/utils'

export default function OutfitRecentUpdates({ items }: { items: RecentObtainedOutfit[] }) {
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
          {items.map((item) => {
            const variant = item.outfit_sets?.outfit_variants.find(
              (v) => v.slug === item.outfit_variant
            )
            const setTitle = item.outfit_sets?.title ?? toTitle(item.outfit_set ?? '')

            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton component="a" href={`/outfits/${item.outfit_set}`}>
                  <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                    <LazyImage
                      kind='avatar'
                      src={variant?.image_url ?? undefined}
                      title={setTitle}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={variant?.title ?? setTitle}
                    secondary={
                      variant?.title
                        ? `${setTitle} • ${item.outfit_categories?.title}`
                        : item.outfit_categories?.title
                    }
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
            )
          })}
        </List>
      </CardContent>
    </Card>
  )
}
