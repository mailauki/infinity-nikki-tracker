'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { Search } from '@mui/icons-material'

import { searchAll } from '@/hooks/data/search'
import { isSearchableQuery } from '@/lib/search/query'
import SearchResults from './search-results'
import type { SearchResult } from '@/lib/search/types'

const DEBOUNCE_MS = 250

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  // Query is local state ONLY -- no router, so typing never creates history
  // entries. The /search page is the surface that owns a URL.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  // Guards against a slow early request resolving after a fast later one and
  // overwriting fresher results.
  const latest = useRef(0)

  useEffect(() => {
    if (!isSearchableQuery(query)) {
      setResults([])
      return
    }

    const token = ++latest.current
    const timer = setTimeout(async () => {
      const found = await searchAll(query)
      if (latest.current === token) setResults(found)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  // Reset on close so reopening starts clean rather than showing stale hits.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  return (
    <Dialog fullWidth fullScreen={fullScreen} maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={visuallyHidden}>Search</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search outfits, pieces, seasons…"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {isSearchableQuery(query) && (
          <SearchResults limitPerKind={5} results={results} onNavigate={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
