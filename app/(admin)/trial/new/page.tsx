import AddTrialForm from './add-trial-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Trial',
}

export default function NewTrialPage() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <AddTrialForm />
    </Stack>
  )
}
