import { EurekaVariantRaw } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'

export default function EurekaVariantList({ rows }: { rows: EurekaVariantRaw[] }) {
  return (
    <AdminList
      title="Eureka Variant"
      slug="eureka-variant"
      rows={rows}
      getKey={(v) => v.id}
      renderRow={(row) => (
        <ListRow
          list="eureka-variant"
          title={row.eureka_set ?? '—'}
          subheader={[row.category, row.color].filter(Boolean).join(' • ') || undefined}
          slug={row.slug ?? undefined}
          image_url={row.image_url ?? undefined}
          updated_at={row.updated_at}
        />
      )}
    />
  )
}
