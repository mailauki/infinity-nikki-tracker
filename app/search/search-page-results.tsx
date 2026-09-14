'use client'

import { useEffect, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'

import { searchAll } from '@/hooks/data/search'
import SearchResults from '@/components/search/search-results'
import type { SearchResult } from '@/lib/search/types'

export default function SearchPageResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    setLoading(true)
    searchAll(query).then((data) => {
      if (active) {
        setResults(data)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [query])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return <SearchResults results={results} />
}
