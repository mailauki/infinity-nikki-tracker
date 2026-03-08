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
			title={
			<Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
				}
			subheader={
				<Typography variant="h2" component="p" sx={{ my: 1 }}>
          {count}
        </Typography>
			}
			/>
			<CardContent component={Stack} sx={{ flex: 1 }} justifyContent='flex-end' spacing={1}>
				<Divider />
				<Button variant="outlined" size="small" startIcon={<AddIcon />} href={addHref} sx={{ width: 'fit-content' }}>
          Add
        </Button>
			</CardContent>
    </Card>
  )
}
