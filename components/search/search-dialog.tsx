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
import { claimFacets, type FacetVocabulary } from '@/lib/search/facets'
import { createClient } from '@/lib/supabase/client'
import SearchResults from './search-results'
import type { SearchFacet, SearchResult } from '@/lib/search/types'

const DEBOUNCE_MS = 250

// Thin literal pass -> retry with facet terms claimed. Same rule as the
// RPC's fuzzy fallback: strict first, clever only on rescue.
const FACET_RETRY_THRESHOLD = 5

const EMPTY_VOCABULARY: FacetVocabulary = {
  style: [],
  label: [],
  ability: [],
  location: [],
  color: [],
  category: [],
}

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  // Query is local state ONLY -- no router, so typing never creates history
  // entries. The /search page is the surface that owns a URL.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [facets, setFacets] = useState<SearchFacet[]>([])
  const [vocabulary, setVocabulary] = useState<FacetVocabulary>(EMPTY_VOCABULARY)
  // Guards against a slow early request resolving after a fast later one and
  // overwriting fresher results.
  const latest = useRef(0)

  // Fetch the facet vocabulary once, the first time the dialog opens -- a
  // handful of rows that don't change during a session, not worth refetching
  // per keystroke or before the user has ever opened the dialog.
  useEffect(() => {
    if (!open || vocabulary !== EMPTY_VOCABULARY) return

    const supabase = createClient()

    async function loadVocabulary() {
      const [styles, labels, colors, categories] = await Promise.all([
        supabase.from('styles').select('slug, title'),
        supabase.from('labels').select('slug, title'),
        supabase.from('eureka_colors').select('slug, title'),
        supabase.from('eureka_categories').select('slug, title'),
      ])

      setVocabulary({
        style: (styles.data ?? []).map((row) => ({
          value: row.slug,
          label: row.title ?? row.slug,
        })),
        label: (labels.data ?? []).map((row) => ({
          value: row.slug,
          label: row.title ?? row.slug,
        })),
        ability: [],
        location: [],
        color: (colors.data ?? []).map((row) => ({
          value: row.slug,
          label: row.title ?? row.slug,
        })),
        category: (categories.data ?? []).map((row) => ({ value: row.slug, label: row.title })),
      })
    }

    loadVocabulary()
  }, [open, vocabulary])

  useEffect(() => {
    if (!isSearchableQuery(query)) {
      setResults([])
      setFacets([])
      return
    }

    const token = ++latest.current
    const timer = setTimeout(async () => {
      const literal = await searchAll(query)

      if (literal.length >= FACET_RETRY_THRESHOLD) {
        if (latest.current === token) {
          setResults(literal)
          setFacets([])
        }
        return
      }

      const { facets: claimed, remainder } = claimFacets(query, vocabulary)
      // Nothing claimed, or nothing left to search on -- keep the literal answer.
      if (claimed.length === 0 || remainder === '') {
        if (latest.current === token) {
          setResults(literal)
          setFacets([])
        }
        return
      }

      const narrowed = await searchAll(remainder)
      if (latest.current === token) {
        setResults(narrowed.length > 0 ? narrowed : literal)
        setFacets(narrowed.length > 0 ? claimed : [])
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, vocabulary])

  // Reset on close so reopening starts clean rather than showing stale hits.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setFacets([])
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
          <SearchResults facets={facets} limitPerKind={5} results={results} onNavigate={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
