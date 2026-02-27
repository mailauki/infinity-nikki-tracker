import { Chip } from '@mui/material'

export default function ProgressBadge({ percentage }: { percentage: number }) {
  return (
		<Chip
		sx={{ fontWeight: 'bold', textTransform: "uppercase" }}
		color={percentage === 100 ? 'primary' : 'secondary'}
		label={percentage === 100 ? 'Complete' : 'Unfinished'}
		/>
  )
}
