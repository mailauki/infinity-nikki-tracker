import { Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

export function StatCard({
  title,
  count,
  addHref,
}: {
  title: string
  count: number
  addHref: string
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h2" component="p" sx={{ my: 1 }}>
          {count}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} href={addHref}>
            Add
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
