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
          <Typography color="text.secondary" variant="overline">
            Recently Updated
          </Typography>
        }
      />
      <CardContent>
        <List disablePadding>
          {items.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton component="a" href={`/outfits/${item.outfit_set}`}>
                <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                  <LazyImage
                    alt={item.outfit_sets?.title ?? toTitle(item.outfit_set ?? '')}
                    kind="square"
                    size="md"
                    src={
                      item.outfit_sets?.outfit_variants.find(
                        (v) =>
                          v.outfit_category === item.outfit_category &&
                          v.evolution === item.evolution
                      )?.image_url ?? undefined
                    }
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={item.outfit_sets?.title ?? toTitle(item.outfit_set ?? '')}
                  secondary={[item.outfit_categories?.title, item.evolutions?.title]
                    .filter(Boolean)
                    .join(' • ')}
                  slotProps={{
                    primary: { variant: 'body2' },
                    secondary: { variant: 'caption' },
                  }}
                />
                <Typography color="text.secondary" variant="caption">
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
