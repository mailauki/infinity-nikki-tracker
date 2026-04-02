import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { RecentObtained } from '@/lib/types/eureka'
import { toTitle } from '@/lib/utils'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RecentUpdates({ items }: { items: RecentObtained[] }) {
  if (!items?.length) return null

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        title={
          <Typography color="text.secondary" variant="overline">
            Recently Updated
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 0, '&:last-child': { pb: 1 } }}>
        <List disablePadding>
          {items.map((item) => (
            <ListItem key={item.id} disableGutters>
              <ListItemText
                primary={item.eureka_sets?.title ?? toTitle(item.eureka_set ?? '')}
                secondary={[item.categories?.title, item.colors?.title]
                  .filter(Boolean)
                  .join(' — ')}
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
