import { Box, Container, Typography } from '@mui/material'
import AddTrialForm from '@/components/forms/trial/add-trial-form'

export default function NewTrialPage() {
  return (
    <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Typography variant="h3" component="h1">
          Add Trial
        </Typography>
        <AddTrialForm />
      </Box>
    </Container>
  )
}
