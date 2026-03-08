import { EurekaSet } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'

export default function EurekaSetList({ rows }: { rows: EurekaSet[] }) {
  return (
    <AdminList
      title="Eureka Set"
      slug="eureka-set"
      rows={rows}
      getKey={(set) => set.id}
      renderRow={(row) => (
        <ListRow
          list="eureka-set"
          title={row.title}
          subheader={row.trial ?? undefined}
          slug={row.slug ?? undefined}
          image_url={row.image_url}
          updated_at={row.updated_at}
        />
      )}
    />
  )
}
