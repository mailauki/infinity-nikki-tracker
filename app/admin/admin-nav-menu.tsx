'use client'

import { navLinksData } from '@/lib/nav-links'
import { ExpandMore } from '@mui/icons-material'
import { Button, Menu, MenuItem, Stack } from '@mui/material'
import Link from 'next/link'
import React from 'react'

export default function AdminNavMenu() {
  const id = React.useId()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [openTitle, setOpenTitle] = React.useState<string | null>(null)

  const openSection = navLinksData.admin.tabs.find((section) => section.title === openTitle)

  const handleClose = () => {
    setAnchorEl(null)
    setOpenTitle(null)
  }

  return (
    <Stack direction="row" spacing={1}>
      {navLinksData.admin.tabs.map((section) => {
        const isOpen = openTitle === section.title
        return (
          <Button
            key={section.title}
            aria-controls={isOpen ? `${id}-menu` : undefined}
            aria-expanded={isOpen}
            aria-haspopup="true"
            endIcon={<ExpandMore />}
            id={`${id}-${section.title}-button`}
            onClick={(event) => {
              setAnchorEl(event.currentTarget)
              setOpenTitle(section.title)
            }}
          >
            {section.title}
          </Button>
        )
      })}
      <Menu
        anchorEl={anchorEl}
        id={`${id}-menu`}
        open={Boolean(anchorEl && openSection)}
        slotProps={{
          list: {
            'aria-labelledby': openSection && `${id}-${openSection.title}-button`,
          },
        }}
        onClose={handleClose}
      >
        {openSection?.items?.map((tab) => (
          <MenuItem key={tab.title} component={Link} href={tab.url} onClick={handleClose}>
            {tab.title}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  )
}
