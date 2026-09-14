'use client'

import { useEffect, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Search } from '@mui/icons-material'

import SearchDialog from './search-dialog'

export default function SearchCollection() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // metaKey for macOS, ctrlKey elsewhere.
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Tooltip title="Search">
        <IconButton aria-label="Search" onClick={() => setOpen(true)}>
          <Search />
        </IconButton>
      </Tooltip>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
