import { Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export function ViewAllButton({ href }: { href: string }) {
  return (
    <Button variant="text" color="primary" endIcon={<ArrowForwardIcon />} size="small" href={href}>
      View all
    </Button>
  )
}
