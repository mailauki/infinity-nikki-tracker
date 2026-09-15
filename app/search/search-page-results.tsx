'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'
import { Close, Search } from '@mui/icons-material'

import { searchAll } from '@/hooks/data/search'
import SearchResults from '@/components/search/search-results'
import { isSearchableQuery } from '@/lib/search/query'
import type { SearchResult } from '@/lib/search/types'

const DEBOUNCE_MS = 250

export default function SearchPageResults({ initialQuery }: { initialQuery: string }) {
  // The query is page state, seeded ONCE from ?q= and never written back to the
  // URL. `?q=` is how the modal's "See all results" link hands a query over and
  // how a refresh or a shared link arrives with one -- but editing the field
  // afterwards is local, so typing here creates no history entries and does not
  // re-run the page. The URL keeps whatever query the page was opened with.
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(isSearchableQuery(initialQuery))
  // Guards against a slow early request resolving after a fast later one and
  // overwriting fresher results.
  const latest = useRef(0)
  // Lets the clear button hand focus back to the field it emptied.
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSearchableQuery(query)) {
      setResults([])
      setLoading(false)
      return
    }

    const token = ++latest.current
    setLoading(true)

    const timer = setTimeout(async () => {
      const found = await searchAll(query)
      if (latest.current === token) {
        setResults(found)
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <Box>
      <TextField
        autoFocus
        fullWidth
        inputRef={inputRef}
        placeholder="Search outfits, pieces, seasons…"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            // Only rendered when there is something to clear, so the field does
            // not carry a permanently dead control. Focus returns to the input
            // rather than being left on a button that just vanished.
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear search"
                  edge="end"
                  size="small"
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
        sx={{ mb: 2 }}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SearchResults results={results} />
      )}
    </Box>
  )
}
