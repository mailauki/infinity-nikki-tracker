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
        value={percentage}
        variant="determinate"
        color={percentage === 100 ? 'primary' : 'inherit'}
        size={102}
        sx={{ backgroundColor: 'divider', borderRadius: '100px' }}
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
        <Avatar size="lg" sx={{ backgroundColor: 'background.paper' }} src={image_url} alt={slug}>
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            component="p"
            color={percentage === 100 ? 'primary' : 'textPrimary'}
          >
            <Category fontSize="large" />
          </Typography>
        </Avatar>
      </Box>
    </Box>
  )
}
