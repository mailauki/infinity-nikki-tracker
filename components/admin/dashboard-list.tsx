import {
  Box,
  CardHeader,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { ViewAllButton } from '@/components/admin/view-all-button'

export type DashboardListItem = {
  key: string | number
  href: string
  primary: string
  secondary: string
  secondaryAction?: React.ReactNode
}

export function DashboardList({
  title,
  viewHref,
  items,
}: {
  title: string
  viewHref: string
  items: DashboardListItem[]
}) {
  return (
    <Box>
      <CardHeader
        disableTypography
        title={
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
        }
        action={<ViewAllButton href={viewHref} />}
      />
      <List disablePadding>
        {items.map((item) => (
          <ListItem key={item.key} disablePadding divider secondaryAction={item.secondaryAction}>
            <ListItemButton href={item.href}>
              <ListItemText
                primary={item.primary}
                secondary={item.secondary}
                slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
