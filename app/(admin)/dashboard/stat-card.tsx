import { Button, Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ArrowForward } from '@mui/icons-material'

export function StatCard({
  title,
  count,
  addHref,
  tabHref,
}: {
  title: string
  count: number
  addHref?: string
  tabHref?: string
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
      {(addHref || tabHref) && (
        <CardContent component={Stack} spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <Divider />
          <Stack direction="row" spacing={1}>
            {addHref && (<Button
              href={addHref}
              size="small"
              startIcon={<AddIcon />}
              sx={{ width: 'fit-content' }}
              variant="outlined"
            >
              Add
            </Button>)}
            {tabHref && (<Button
              endIcon={<ArrowForward />}
              href={tabHref}
              size="small"
              sx={{ width: 'fit-content' }}
              variant="outlined"
            >
              View all
            </Button>)}
          </Stack>
        </CardContent>
      )}
    </Card>
  )
}
