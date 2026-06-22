'use client'

import { Button, Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useFormConfig } from './form-context'
import { useEffect } from 'react'
import { enqueueSnackbar } from 'notistack'

export default function FormToolBar() {
  const {
    formId,
    backUrl,
    pending,
    showAddAnother,
    showUpdateOnly,
    showUpdateNext,
    savedTitle,
    setFormConfig,
  } = useFormConfig()

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
        <Button component="a" href={backUrl} variant="outlined">
          Cancel
        </Button>
        {showAddAnother && (
          <Button
            disabled={pending}
            form={formId}
            name="add_another"
            type="submit"
            value="true"
            variant="outlined"
          >
            {pending ? 'Saving...' : 'Save & add another'}
          </Button>
        )}
        {showUpdateOnly && (
          <Button
            disabled={pending}
            form={formId}
            name="update_only"
            type="submit"
            value="true"
            variant="outlined"
          >
            {pending ? 'Saving...' : 'Update'}
          </Button>
        )}
        {showUpdateNext && (
          <Button
            disabled={pending}
            form={formId}
            name="update_next"
            type="submit"
            value="true"
            variant="outlined"
          >
            {pending ? 'Saving...' : 'Update & next item'}
          </Button>
        )}
        <Button disabled={pending} form={formId} type="submit" variant="contained">
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </NavBarToolbar>
  )
}
