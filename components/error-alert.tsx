'use client'

import { Alert, Button } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

export default function ErrorAlert({ message = 'Something went wrong. Please try again.' }) {
  return (
    <Alert
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      }
      severity="error"
    >
      {message}
    </Alert>
  )
}
