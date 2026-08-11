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
import RarityStars from '@/components/rarity-stars'
import { RecentObtainedMomoCloak } from '@/lib/types/momo'
import { toTitle, formatDate } from '@/lib/utils'

export default function MomoCloakRecentUpdates({ items }: { items: RecentObtainedMomoCloak[] }) {
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
            const cloak = item.momo_cloaks
            const title = cloak?.title ?? toTitle(item.momo_cloak ?? '')

            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton component="a" href={`/momo-cloaks/${item.momo_cloak}`}>
                  <ListItemAvatar sx={{ width: 'fit-content', mr: 2 }}>
                    <LazyImage kind="avatar" src={cloak?.image_url ?? undefined} title={title} />
                  </ListItemAvatar>
                  {/* Cloaks are flat — no set or category to name on the second
                      line — so rarity stands in as the secondary detail. */}
                  <ListItemText
                    primary={title}
                    secondary={cloak ? <RarityStars rarity={cloak.rarity ?? 0} /> : null}
                    slotProps={{
                      primary: { variant: 'body2' },
                      // RarityStars wraps a Stack (a div); the secondary slot
                      // defaults to <p>, which cannot legally contain one.
                      secondary: { variant: 'caption', component: 'span' },
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
