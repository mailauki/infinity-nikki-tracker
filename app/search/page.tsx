import { Suspense } from 'react'
import type { Metadata } from 'next'

import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'
import SearchPageResults from './search-page-results'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search results for "${q}"` : pageTitle('/search') }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <PageShell titleVisible title={pageTitle('/search')}>
      <Suspense>
        <SearchPageResults query={q ?? ''} />
      </Suspense>
    </PageShell>
  )
}
