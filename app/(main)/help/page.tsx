'use client'

import BugReportForm from '@/components/forms/bug-report-form'
import FeatureRequestForm from '@/components/forms/feature-request-form'
import PageContainer from '@/components/page-container'
import { AddComment, BugReport, Coffee } from '@mui/icons-material'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useState } from 'react'

export default function HelpPage() {
  const [featureOpen, setFeatureOpen] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)

  return (
    <PageContainer title="Help" size="sm">
      <List>
        <ListItem>
          <ListItemButton onClick={() => setFeatureOpen(true)}>
            <ListItemIcon>
              <AddComment />
            </ListItemIcon>
            <ListItemText
              primary="Feature request"
              secondary="Have a suggestion or feature you would like to see?"
            />
          </ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton href="https://buymeacoffee.com/mailauki" target="_blank">
            <ListItemIcon>
              <Coffee />
            </ListItemIcon>
            <ListItemText
              primary="Buy me a coffee"
              secondary="Support me to keep improving this app!"
            />
          </ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton onClick={() => setBugOpen(true)}>
            <ListItemIcon>
              <BugReport />
            </ListItemIcon>
            <ListItemText
              primary="Report an issue"
              secondary="Found a bug or something missing?"
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Dialog open={featureOpen} onClose={() => setFeatureOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Feature Request</DialogTitle>
        <DialogContent>
          <FeatureRequestForm onClose={() => setFeatureOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={bugOpen} onClose={() => setBugOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Report an Issue</DialogTitle>
        <DialogContent>
          <BugReportForm onClose={() => setBugOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
