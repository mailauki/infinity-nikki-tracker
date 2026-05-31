'use client'

import { Button, Stack } from '@mui/material'
import SubAppBar from '@/components/sub-appbar'
import { useFormConfig } from './form-context'

export default function FormToolBar() {
  const { formId, backUrl, pending } = useFormConfig()

  if (!formId) return null

  return (
    <SubAppBar>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ flex: 1 }}>
        <Button component="a" href={backUrl} variant="outlined">
          Cancel
        </Button>
        <Button disabled={pending} form={formId} type="submit" variant="contained">
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </SubAppBar>
  )
}
