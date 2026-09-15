'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'
import { Close, Search } from '@mui/icons-material'

import StickyBar from '@/components/navbar/sticky-bar'
import { TRANSLUCENT_SURFACE } from '@/lib/theme'
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
    <>
      {/* Portals into the shell's sticky sub-toolbar, pinned under the AppBar
          — the same slot the four results bars use, so the field stays put as
          results scroll without this component guessing at a top offset. */}
      <StickyBar>
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
          // Translucent + blurred, matching the four results bars: a sticky
          // element keeps its own background, so rows would otherwise show
          // through as they scroll underneath it.
          sx={{ backgroundColor: TRANSLUCENT_SURFACE, backdropFilter: 'blur(8px)' }}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </StickyBar>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SearchResults results={results} />
      )}
    </>
  )
}
