'use client'

import {
  Button,
  CardActionArea,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import CheckIcon from '@mui/icons-material/Check'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SaveIcon from '@mui/icons-material/SaveAlt'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { ADMIN_DASHBOARD, useFormConfig } from './form-context'
import { useEffect, type ReactNode } from 'react'
import { enqueueSnackbar } from 'notistack'

export default function FormToolBar() {
  const {
    formId,
    pending,
    showAddAnother,
    showUpdateOnly,
    showUpdateNext,
    savedTitle,
    setFormConfig,
  } = useFormConfig()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (!savedTitle) return
    enqueueSnackbar(`"${savedTitle}" saved successfully!`, {
      variant: 'success',
    })
    setFormConfig({ savedTitle: undefined })
  }, [savedTitle, setFormConfig])

  if (!formId) return null

  return (
    <ToolbarSlot>
      <ToolbarButton
        component="a"
        href={ADMIN_DASHBOARD}
        icon={<CloseIcon fontSize="small" />}
        isMobile={isMobile}
        label="Cancel"
        variant="outlined"
      />
      {showAddAnother && (
        <ToolbarButton
          disabled={pending}
          form={formId}
          icon={<PlaylistAddIcon fontSize="small" />}
          isMobile={isMobile}
          label={pending ? 'Saving...' : 'Add More'}
          name="add_another"
          type="submit"
          value="true"
          variant="outlined"
        />
      )}
      {showUpdateOnly && (
        <ToolbarButton
          disabled={pending}
          form={formId}
          icon={<CheckIcon fontSize="small" />}
          isMobile={isMobile}
          label={pending ? 'Saving...' : 'Update'}
          name="update_only"
          type="submit"
          value="true"
          variant="outlined"
        />
      )}
      {showUpdateNext && (
        <ToolbarButton
          disabled={pending}
          form={formId}
          icon={<SkipNextIcon fontSize="small" />}
          isMobile={isMobile}
          label={pending ? 'Saving...' : 'Next Item'}
          name="update_next"
          type="submit"
          value="true"
          variant="outlined"
        />
      )}
      <ToolbarButton
        disabled={pending}
        form={formId}
        icon={<SaveIcon fontSize="small" />}
        isMobile={isMobile}
        label={pending ? 'Saving...' : 'Save'}
        type="submit"
        variant="contained"
      />
    </ToolbarSlot>
  )
}

type ToolbarButtonProps = {
  isMobile: boolean
  label: string
  icon: ReactNode
  variant: 'outlined' | 'contained'
  disabled?: boolean
  component?: 'a'
  href?: string
  form?: string
  name?: string
  type?: 'submit'
  value?: string
}

function ToolbarButton({ isMobile, label, icon, variant, ...props }: ToolbarButtonProps) {
  if (isMobile) {
    return (
      <CardActionArea
        aria-label={label}
        sx={{ p: 0.5, borderRadius: (theme) => `${theme.shape.borderRadius}px` }}
        {...props}
      >
        <Stack sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Chip color={variant === 'contained' ? 'primary' : 'default'} label={icon} size="small" />
          <Typography noWrap variant="caption">
            {label}
          </Typography>
        </Stack>
      </CardActionArea>
    )
  }

  return (
    <Button startIcon={icon} variant={variant} {...props}>
      {label}
    </Button>
  )
}
