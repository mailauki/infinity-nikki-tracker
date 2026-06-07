import {
  Button,
  Card,
  CardActions,
  CardContent,
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
            {/* {listHref && (
							<Tooltip title='View all'>
								<IconButton component='a' href={listHref} sx={{ ml: 'auto' }} color='primary'>
									<ArrowForward />
								</IconButton>
							</Tooltip>
						)} */}
            {/* {addHref && (
              <Button
                href={addHref}
                size="small"
                startIcon={<AddIcon />}
                sx={{ width: 'fit-content' }}
                variant="outlined"
              >
                Add
              </Button>
            )} */}
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
      {/* {(addHref || listHref) && (
        <CardContent component={Stack} spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
						{addHref && (
							<Tooltip title='Add'>
								<IconButton component='a' href={addHref}>
									<AddIcon />
								</IconButton>
							</Tooltip>
						)}
						{listHref && (
							<Tooltip title='View all'>
								<IconButton component='a' href={listHref} sx={{ alignSelf: 'flex-end' }}>
									<ArrowForward />
								</IconButton>
							</Tooltip>
						)}
            {addHref && (
              <Button
                href={addHref}
                size="small"
                startIcon={<AddIcon />}
                sx={{ width: 'fit-content' }}
                variant="outlined"
              >
                Add
              </Button>
            )}
            {listHref && (
              <Button
                endIcon={<ArrowForward />}
                href={listHref}
                size="small"
                sx={{ width: 'fit-content' }}
                variant="outlined"
              >
                View all
              </Button>
            )}
          </Stack>
        </CardContent>
       )} */}
    </Card>
  )
}
