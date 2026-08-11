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
import { RecentObtainedMakeup } from '@/lib/types/makeup'
import { toTitle, formatDate } from '@/lib/utils'

export default function MakeupRecentUpdates({ items }: { items: RecentObtainedMakeup[] }) {
  if (!items?.length) return null

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Recently Obtained
          </Typography>
        }
      />
      <CardContent>
        <List disablePadding>
          {items.map((item) => {
            // The variant embeds directly (obtained_makeup FKs to it), unlike the
            // outfit list which searches its set's variant array.
            const variant = item.makeup_variants
            const setTitle = item.makeup_sets?.title ?? toTitle(item.makeup_set ?? '')
            const categoryTitle = item.makeup_categories?.title
            // An obtained row can name an evolution, but /makeup/{evolution}
            // 404s — getMakeupSet resolves base slugs only, since evolutions
            // are reached through their base set. Link to the base when the
            // row points at one.
            const href = `/makeup/${item.makeup_sets?.base_set ?? item.makeup_set}`

            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton component="a" href={href}>
                  <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                    <LazyImage
                      kind="avatar"
                      src={variant?.image_url ?? undefined}
                      title={setTitle}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={variant?.title ?? setTitle}
                    secondary={variant?.title ? `${setTitle} • ${categoryTitle}` : categoryTitle}
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
            )
          })}
        </List>
      </CardContent>
    </Card>
  )
}
