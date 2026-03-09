'use client'

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
  const [open, setOpen] = useState(false)

  return (
    <PageContainer title="Help" size="sm">
      <List>
        <ListItem>
          <ListItemButton onClick={() => setOpen(true)}>
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
          <ListItemButton>
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Feature Request</DialogTitle>
        <DialogContent>
          <FeatureRequestForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
