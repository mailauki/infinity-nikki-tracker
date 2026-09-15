'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { Close, Search } from '@mui/icons-material'

import { searchAll } from '@/hooks/data/search'
import { SEARCH_RESULT_LIMIT, isSearchableQuery, normalizeQuery } from '@/lib/search/query'
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
      let styles, labels, colors, categories

      try {
        ;[styles, labels, colors, categories] = await Promise.all([
          supabase.from('styles').select('slug, title'),
          supabase.from('labels').select('slug, title'),
          supabase.from('eureka_colors').select('slug, title'),
          supabase.from('eureka_categories').select('slug, title'),
        ])
      } catch (error) {
        // Leave vocabulary at EMPTY_VOCABULARY so the guard above retries on
        // the next open, instead of latching a permanently-broken session.
        console.error('facet vocabulary fetch failed', error)
        return
      }

      // A per-table RLS/permission failure resolves with { data: null, error }
      // rather than rejecting -- it would otherwise vanish into `?? []`.
      for (const result of [styles, labels, colors, categories]) {
        if (result.error) console.error('facet vocabulary fetch failed', result.error)
      }

      const next: FacetVocabulary = {
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
      }

      // A fetch that "succeeds" but returns nothing (e.g. every table erroring
      // above) must not latch either -- writing a new-but-still-empty object
      // is no longer === EMPTY_VOCABULARY, so the guard would never retry.
      const gotSomething = Object.values(next).some((entries) => entries.length > 0)
      if (!gotSomething) {
        console.error('facet vocabulary fetch returned nothing; will retry next open')
        return
      }

      setVocabulary(next)
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

      // Facet matching is exact equality against lowercase slugs, and claimFacets
      // splits on single spaces -- so it must see the SAME normalized string
      // searchAll() normalizes internally, or `Moon Iridescent` claims nothing.
      const { facets: claimed, remainder } = claimFacets(normalizeQuery(query), vocabulary)
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
      <DialogTitle
        id="search-dialog-title"
        // sx={visuallyHidden}
        sx={{ m: 0, p: 2 }}
      >
        Search
      </DialogTitle>
      <IconButton
        aria-label="close"
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
        onClick={onClose}
      >
        <Close />
      </IconButton>
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
        {results.length > 5 && (
          <Button
            fullWidth
            component={Link}
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onClose}
          >
            {/* At the cap the count is a lower bound, not a total -- the RPC
                stopped counting at SEARCH_RESULT_LIMIT, so stating it would be
                provably wrong for any query with more matches. */}
            {results.length === SEARCH_RESULT_LIMIT
              ? 'See all results'
              : `See all ${results.length} results`}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
