'use client'

import { Button, Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useFormConfig } from './form-context'

export default function FormToolBar() {
  const { formId, backUrl, pending } = useFormConfig()

  if (!formId) return null

  return (
    <NavBarToolbar>
      <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: "flex-end" }}>
        <Button component="a" href={backUrl} variant="outlined">
          Cancel
        </Button>
        <Button disabled={pending} form={formId} type="submit" variant="contained">
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </NavBarToolbar>
  )
}
