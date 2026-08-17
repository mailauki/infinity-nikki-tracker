'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Alert, Box, Button, DialogActions, Divider, Stack, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

export interface ReceiptData {
  type: string
  category: string
  title: string
  description: string
  page_path: string | null
  entity_title: string | null
  entity_slug: string | null
}

interface FeedbackReceiptProps {
  submission: ReceiptData
  imageNames: string[]
  imagesFailed: boolean
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" size="small" variant="label">
        {label}
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }} variant="body">
        {value}
      </Typography>
    </Box>
  )
}

// The in-app receipt is the primary confirmation: it needs no email address
// and no delivery, so an anonymous submitter still leaves with a record of
// exactly what they sent.
export default function FeedbackReceipt({
  submission,
  imageNames,
  imagesFailed,
  onClose,
}: FeedbackReceiptProps) {
  const subject = submission.entity_title ?? submission.entity_slug
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The form unmounts in place when this replaces it, taking focus with it.
  // Move focus to the receipt's heading so screen reader users get an
  // immediate, unambiguous signal that the submission succeeded.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Box>
      {/* Visually-hidden live region: belt-and-suspenders in case the focus
          move above is swallowed (e.g. by a screen reader's own heuristics). */}
      <Box
        aria-live="polite"
        role="status"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        Report submitted
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <CheckCircleOutlineIcon color="success" />
        <Typography ref={headingRef} component="h3" size="small" tabIndex={-1} variant="headline">
          Thanks — we got it
        </Typography>
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 2 }} variant="body">
        Here is a copy of what you sent. There may not be an individual reply, but every report is
        read.
      </Typography>

      {imagesFailed && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your report was received, but at least one screenshot could not be attached.
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        <Field label="Category" value={submission.category} />
        <Field label="Title" value={submission.title} />
        <Field label="Description" value={submission.description} />
        {subject && <Field label="About" value={subject} />}
        {submission.page_path && <Field label="Page" value={submission.page_path} />}
        {imageNames.length > 0 && (
          <Field
            label={imageNames.length === 1 ? 'Screenshot' : 'Screenshots'}
            value={imageNames.join(', ')}
          />
        )}
      </Stack>

      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Box>
  )
}
