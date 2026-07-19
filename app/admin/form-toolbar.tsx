'use client'

import { Button, IconButton, Stack, Tooltip, useMediaQuery, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import CheckIcon from '@mui/icons-material/Check'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SaveIcon from '@mui/icons-material/SaveAlt'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
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
    <NavBarToolbar>
      <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
        <ToolbarButton
          component="a"
          href={ADMIN_DASHBOARD}
          icon={<CloseIcon />}
          isMobile={isMobile}
          label="Cancel"
          variant="outlined"
        />
        {showAddAnother && (
          <ToolbarButton
            disabled={pending}
            form={formId}
            icon={<PlaylistAddIcon />}
            isMobile={isMobile}
            label={pending ? 'Saving...' : 'Save & add another'}
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
            icon={<CheckIcon />}
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
            icon={<SkipNextIcon />}
            isMobile={isMobile}
            label={pending ? 'Saving...' : 'Update & next item'}
            name="update_next"
            type="submit"
            value="true"
            variant="outlined"
          />
        )}
        <ToolbarButton
          disabled={pending}
          form={formId}
          icon={<SaveIcon />}
          isMobile={isMobile}
          label={pending ? 'Saving...' : 'Save'}
          type="submit"
          variant="contained"
        />
      </Stack>
    </NavBarToolbar>
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
      <Tooltip title={label}>
        <span>
          <IconButton
            aria-label={label}
            color={variant === 'contained' ? 'primary' : 'default'}
            size="small"
            {...props}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    )
  }

  return (
    <Button startIcon={icon} variant={variant} {...props}>
      {label}
    </Button>
  )
}
