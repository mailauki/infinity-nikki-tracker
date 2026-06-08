'use client'

import { Alert, Button, Snackbar, Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useFormConfig } from './form-context'

export default function FormToolBar() {
  const { formId, backUrl, pending, showAddAnother, savedTitle, setFormConfig } = useFormConfig()

  if (!formId) return null

  return (
    <>
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
          <Button disabled={pending} form={formId} type="submit" variant="contained">
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </NavBarToolbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        autoHideDuration={6000}
        message={savedTitle ? `"${savedTitle}" saved successfully` : 'Saved successfully'}
        open={!!savedTitle}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          setFormConfig({ savedTitle: undefined })
        }}
      >
        <Alert severity="success" sx={{ width: '100%' }} variant="filled">
          {savedTitle ? `"${savedTitle}" saved successfully!` : 'Saved successfully!'}
        </Alert>
      </Snackbar>
    </>
  )
}
