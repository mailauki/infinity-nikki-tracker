import { Category } from '@mui/icons-material'
import { Avatar, Box, CircularProgress, Typography } from '@mui/material'

export default function ProgressImage({
  image_url,
  slug,
  percentage,
}: {
  image_url: string
  slug: string
  percentage: number
}) {
  return (
    <Box sx={{ position: 'relative' }}>
      <CircularProgress
        color={percentage === 100 ? 'primary' : 'inherit'}
        size={102}
        sx={{ backgroundColor: 'divider', borderRadius: '100px' }}
        value={percentage}
        variant="determinate"
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          p: 0.5,
        }}
      >
        <Avatar alt={slug} size="lg" src={image_url} sx={{ backgroundColor: 'background.paper' }}>
          <Typography
            color={percentage === 100 ? 'primary' : 'textPrimary'}
            component="p"
            fontWeight="medium"
            variant="subtitle1"
          >
            <Category fontSize="large" />
          </Typography>
        </Avatar>
      </Box>
    </Box>
  )
}
