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
    <Typography
      component={FormLabel}
      id={id}
      sx={{ fontSize: 'overline.fontSize', pb: 0.5 }}
      variant="overline"
    >
      {label && label}
      {children && children}
    </Typography>
  )
}
