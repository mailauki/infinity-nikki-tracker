import { FormLabel, Typography } from '@mui/material'

export default function ToggleGroupLabel({
  label,
  children,
  id,
}: {
  label?: string
  children?: string
  id?: string
}) {
  return (
    <Typography component={FormLabel} id={id} size="small" sx={{ pb: 0.5 }} variant="label">
      {label && label}
      {children && children}
    </Typography>
  )
}
