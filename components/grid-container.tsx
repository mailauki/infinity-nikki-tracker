import { Grid, Stack } from '@mui/material'

export default function GridContainer({
  mainContent,
  sideContent,
}: {
  mainContent: React.ReactNode
  sideContent?: React.ReactNode
}) {
  return (
    <Grid container spacing={2} columns={{ xs: 2, sm: 8, md: 12 }} sx={{ mb: 2 }}>
      <Grid size={sideContent ? 8 : 12}>{mainContent}</Grid>
      {sideContent && (
        <Grid size={{ xs: 2, sm: 8, md: 4 }}>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row', md: 'column' }}>
            {sideContent}
          </Stack>
        </Grid>
      )}
    </Grid>
  )
}
