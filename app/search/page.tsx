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
        {/* Seeds the field once; the page owns the query in state from there,
            so editing it never rewrites the URL. */}
        <SearchPageResults initialQuery={q ?? ''} />
      </Suspense>
    </PageShell>
  )
}
