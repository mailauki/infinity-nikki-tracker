import { Button, Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material'
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
      <CardHeader
        disableTypography
        subheader={
          <Typography component="p" sx={{ my: 1 }} variant="h2">
            {count}
          </Typography>
        }
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent component={Stack} justifyContent="flex-end" spacing={1} sx={{ flex: 1 }}>
        <Divider />
        <Button
          href={addHref}
          size="small"
          startIcon={<AddIcon />}
          sx={{ width: 'fit-content' }}
          variant="outlined"
        >
          Add
        </Button>
      </CardContent>
    </Card>
  )
}
