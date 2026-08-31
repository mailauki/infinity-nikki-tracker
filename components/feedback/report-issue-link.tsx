'use client'

import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import FeedbackForm from './feedback-form'
import { useReportSubject } from './report-context'
import { entityFromPath } from '@/lib/feedback/entity-from-path'
import type { ReportContext } from '@/lib/types/feedback'
import { ReportProblem } from '@mui/icons-material';

// Lives in the global footer rather than behind a per-page prop: every page
// already renders the footer, so there are no coverage gaps now and none can
// appear as pages are added.
export default function ReportIssueLink() {
  const pathname = usePathname()
  const subject = useReportSubject()
  const [open, setOpen] = useState(false)

  const { entity_type, entity_slug } = entityFromPath(pathname)

  // If the dialog is open and the user navigates (e.g. browser back/forward),
  // it would otherwise stay open and silently re-label itself for the new
  // route's context.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const context: ReportContext = {
    page_path: pathname,
    entity_type,
    entity_slug,
    entity_title: subject,
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<ReportProblem />}
        sx={{ color: 'text.secondary', textTransform: 'none', textWrap: 'nowrap' }}
        onClick={() => setOpen(true)}
      >
        Report a problem
      </Button>

      <Dialog fullWidth maxWidth="sm" open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Report a problem</DialogTitle>
        <DialogContent>
          <FeedbackForm context={context} type="issue" onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
