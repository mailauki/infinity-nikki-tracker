import AddTrialForm from '@/components/forms/trial/add-trial-form'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Trial',
}

export default function NewTrialPage() {
  return (
    <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <AddTrialForm />
      </Stack>
    </Container>
  )
}
