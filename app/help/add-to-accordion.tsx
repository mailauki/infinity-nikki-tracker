'use client'
import { AddToHomeScreen, ExpandMore } from "@mui/icons-material";
import { Stack, Typography, Accordion as MuiAccordion, AccordionProps, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, styled } from "@mui/material";
import React from "react";

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} {...props} />
))(({ theme }) => ({
  // border: `1px solid ${theme.palette.divider}`,
	borderRadius: 8,
  '&:not(:last-child)': {
    // borderBottom: 0,
    borderBottomColor: 'transparent',
		borderRadius: 8,
  },
  '&::before': {
    display: 'none',
		borderRadius: 8,
  },
}));

export default function AddToHomeScreenAccordion() {
  const [expanded, setExpanded] = React.useState<string | false>('panel1');

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

	return (
		<Stack component="section" spacing={1}>
        <Typography component="h2" variant="h5">
          Add to home screen{' '}<AddToHomeScreen color='action' />
        </Typography>
        <Typography color="textSecondary" sx={{ pb: 2 }} variant="body1">
          You can add this app to your home screen or bookmark bar for quick access — no app store
          required.
        </Typography>

        <Stack spacing={1}>
          <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">iOS / iPadOS (Safari)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Safari</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap the <strong>Share</strong> button (the box with an arrow pointing up) in
                        the toolbar.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Scroll down and tap <strong>Add to Home Screen</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Android (Chrome)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Chrome</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap the <strong>three-dot menu</strong> in the top-right corner.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add to Home screen</strong> or <strong>Install app</strong> if
                        shown.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Desktop (Chrome or Edge)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Chrome</strong> or <strong>Edge</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click the <strong>install icon</strong> (a computer with a down arrow) in
                        the address bar, or open the <strong>three-dot menu</strong> and select{' '}
                        <strong>Save and share → Install page as app</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click <strong>Install</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Desktop (Safari on macOS)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Safari</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        From the menu bar, click <strong>File → Add to Dock</strong> (macOS Sonoma
                        and later).
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Stack>
	)
}