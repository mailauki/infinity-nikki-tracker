'use client'
import { Fragment, useState } from 'react'
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
import { Category, Edit } from '@mui/icons-material'
import LazyAvatar from '@/components/lazy-avatar'
import { RecentAdminItem } from '@/hooks/data/admin/recents'
import { formatDate } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import AdminRecentsToggle from './admin-recents-toggle'

const defaultTab = navLinksData.admin.tabs[0]
const defaultItem = defaultTab.items?.[0]

function typeForSelection(tab: string, item: string): string {
  const section = tab === 'Outfits' ? navLinksData.admin.outfits : navLinksData.admin.eureka
  const match = Object.values(section).find((s) => s.title.endsWith(item) || s.title === item)
  return match?.title ?? ''
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
      {/* <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent>
        <AdminRecentsToggle title={title} item={item} tab={tab} onItemChange={setItem} onTabChange={setTab} />
      </CardContent> */}
      <AdminRecentsToggle
        item={item}
        tab={tab}
        title={title}
        onItemChange={setItem}
        onTabChange={setTab}
      />
      <CardContent>
        {filtered.length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 2, textAlign: 'center' }} variant="body2">
            No {item.toLowerCase()} found
          </Typography>
        ) : (
          <List disablePadding>
            {filtered.map((row, i) => (
              <Fragment key={`${row.type}-${row.slug}`}>
                <ListItem
                  secondaryAction={
                    <Tooltip title={`Edit ${row.title}`}>
                      <IconButton color="secondary" href={row.editHref} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <LazyAvatar
                      alt={row.slug}
                      src={row.image_url ?? undefined}
                      sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                    >
                      <Category fontSize="inherit" />
                    </LazyAvatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={row.title}
                    secondary={row.type}
                    slotProps={{
                      primary: { variant: 'body2' },
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
                    sx={{ textAlign: 'right', mr: 2 }}
                  />
                </ListItem>
                {i < filtered.length - 1 && (
                  <Divider component="li" sx={{ mr: 2 }} variant="inset" />
                )}
              </Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}
