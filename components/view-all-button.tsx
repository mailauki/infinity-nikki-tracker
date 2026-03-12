import { Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export function ViewAllButton({ href }: { href: string }) {
  return (
    <Button color="primary" endIcon={<ArrowForwardIcon />} href={href} variant="text">
      View all
    </Button>
  )
}
