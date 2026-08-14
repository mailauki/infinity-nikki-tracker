'use client'
import { Fragment, useState } from 'react'
import {
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import { Category, Edit } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import { RecentAdminItem } from '@/hooks/data/admin/recents'
import { formatDate } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import AdminRecentsToggle from './admin-recents-toggle'

const defaultTab = navLinksData.admin.tabs[0]
const defaultItem = defaultTab.items?.[0]

// Tab items are labelled for the toggle ("Sets"), while `RecentAdminItem.type` carries
// the fully-qualified AdminLink title ("Outfit Sets"). Resolve by the item's `url`, which
// is the one value both sides already agree on — matching on the label alone breaks as
// soon as two tabs share one ("Sets" under both Outfits and Eureka).
const typeByUrl = new Map(
  [
    ...Object.values(navLinksData.admin.outfits),
    ...Object.values(navLinksData.admin.eureka),
    ...Object.values(navLinksData.admin.makeup),
    ...Object.values(navLinksData.admin.momoCloaks),
  ].map((link) => [link.list, link.title])
)

function typeForSelection(tab: string, item: string): string {
  const url = navLinksData.admin.tabs
    .find((t) => t.title === tab)
    ?.items?.find((i) => i.title === item)?.url
  return (url && typeByUrl.get(url)) ?? ''
}

export default function AdminRecentsList({
  title,
  items,
}: {
  title: string
  items: RecentAdminItem[]
}) {
  const [tab, setTab] = useState(defaultTab.title)
  const [item, setItem] = useState(defaultItem?.title ?? '')

  const selectedType = typeForSelection(tab, item)
  const filtered = items.filter((i) => i.type === selectedType).slice(0, 5)

  if (!items.length) return null

  return (
    <Card variant="outlined">
      <AdminRecentsToggle
        item={item}
        tab={tab}
        title={title}
        onItemChange={setItem}
        onTabChange={setTab}
      />
      <CardContent>
        {filtered.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }} variant="body2">
            No {item.toLowerCase()} found
          </Typography>
        ) : (
          <List disablePadding>
            {filtered.map((row, i) => (
              <Fragment key={`${row.type}-${row.slug}`}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Tooltip title={`Edit ${row.title}`}>
                      <IconButton color="secondary" href={row.editHref} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton component="a" href={row.href}>
                    <ListItemAvatar>
                      <LazyImage
                        alt={row.slug}
                        src={row.image_url ?? undefined}
                        sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                      >
                        <Category fontSize="inherit" />
                      </LazyImage>
                    </ListItemAvatar>
                    {/* Evolution rows already carry their "{base set}: " prefix in `title`. */}
                    <ListItemText
                      primary={row.title}
                      secondary={row.type}
                      slotProps={{
                        primary: { variant: 'body2', noWrap: true },
                        secondary: { variant: 'caption' },
                      }}
                    />
                    <ListItemText
                      disableTypography
                      secondary={
                        <Typography color="text.secondary" variant="caption">
                          {row.date ? formatDate(row.date) : '—'}
                        </Typography>
                      }
                      sx={{ textAlign: 'right', mr: 2, minWidth: '100px' }}
                    />
                  </ListItemButton>
                </ListItem>
                {i < filtered.length - 1 && (
                  <Divider component="li" role="listitem" sx={{ mr: 2 }} variant="inset" />
                )}
              </Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}
