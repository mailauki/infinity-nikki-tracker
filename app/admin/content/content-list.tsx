'use client'

import { PageSection } from '@/hooks/data/page-sections'
import { toTitle } from '@/lib/utils'
import ListRow from '../list-row'
import { AdminList } from '../admin-list'

// No add button: sections are seeded by migration and only edited here.
export default function ContentList({ rows }: { rows: PageSection[] }) {
  return (
    <AdminList
      getKey={(row) => row.id}
      renderRow={(row) => (
        <ListRow
          list="admin/content"
          slug={row.id}
          subheader={toTitle(row.page)}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      title="Page Section"
    />
  )
}
