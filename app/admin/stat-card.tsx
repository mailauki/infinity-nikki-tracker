import {
  Button,
  Card,
  CardActions,
  CardHeader,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ArrowForward } from '@mui/icons-material'

export function StatCard({
  title,
  count,
  addHref,
  listHref,
}: {
  title: string
  count: number
  addHref?: string
  listHref?: string
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
          <Typography
            color="text.secondary"
            component="p"
            sx={{ minHeight: 32 }}
            variant="overline"
          >
            {title}
          </Typography>
        }
      />
      {(addHref || listHref) && (
        <>
          <Divider sx={{ mx: 2 }} />
          <CardActions
            sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 50 }}
          >
            {addHref && (
              <Tooltip title="Add">
                <IconButton color="primary" component="a" href={addHref} size="small">
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
            {listHref && (
              <Button
                endIcon={<ArrowForward />}
                href={listHref}
                size="small"
                sx={{ width: 'fit-content', ml: 'auto', textWrap: 'nowrap' }}
              >
                View all
              </Button>
            )}
          </CardActions>
        </>
      )}
    </Card>
  )
}
