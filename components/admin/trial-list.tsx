import { Trial } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'

export default function TrialList({ rows }: { rows: Trial[] }) {
  return (
    <AdminList
      title="Trial"
      slug="trial"
      rows={rows}
      getKey={(trial) => trial.id}
      renderRow={(trial) => (
        <ListRow
          list="trial"
          title={trial.title}
          slug={trial.slug ?? undefined}
          image_url={trial.image_url ?? undefined}
          updated_at={trial.updated_at}
        />
      )}
    />
  )
}
