import { Stack, Typography } from '@mui/material'

export default function ComingSoon() {
  return (
    <Stack sx={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
      <Typography component="span" size="large" variant="display">
        Coming Soon
      </Typography>
    </Stack>
  )
}
