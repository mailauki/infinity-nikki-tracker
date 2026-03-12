'use client'

import BugReportForm from '@/components/forms/bug-report-form'
import FeatureRequestForm from '@/components/forms/feature-request-form'
import { AddComment, BugReport, Coffee, GitHub } from '@mui/icons-material'
import {
  Container,
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

export default function HelpActions() {
  const [featureOpen, setFeatureOpen] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)

  return (
    <>
      <Container disableGutters maxWidth="xs">
        <List disablePadding>
          <ListItem disableGutters>
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
          <ListItem disableGutters>
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
          <ListItem disableGutters>
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
          <ListItem disableGutters>
            <ListItemButton
              href="https://github.com/mailauki/infinity-nikki-tracker/issues"
              target="_blank"
            >
              <ListItemIcon>
                <GitHub />
              </ListItemIcon>
              <ListItemText
                primary="GitHub issues"
                secondary="View or track open issues on GitHub"
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Container>

      <Dialog fullWidth maxWidth="sm" open={featureOpen} onClose={() => setFeatureOpen(false)}>
        <DialogTitle>Feature Request</DialogTitle>
        <DialogContent>
          <FeatureRequestForm onClose={() => setFeatureOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={bugOpen} onClose={() => setBugOpen(false)}>
        <DialogTitle>Report an Issue</DialogTitle>
        <DialogContent>
          <BugReportForm onClose={() => setBugOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
