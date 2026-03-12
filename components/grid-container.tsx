import { Box, Stack } from '@mui/material'

export default function GridContainer({
  mainContent,
  sideContent,
}: {
  mainContent: React.ReactNode
  sideContent?: React.ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
      {sideContent && (
        <Box sx={{ order: { md: 2 }, width: { md: '33%' }, minWidth: '240px' }}>
          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={2}>
            {sideContent}
          </Stack>
        </Box>
      )}
      <Box sx={{ flexGrow: 1, order: { md: 1 }, minWidth: 0 }}>{mainContent}</Box>
    </Box>
  )
}
