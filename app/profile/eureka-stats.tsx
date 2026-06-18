import { EurekaSet, RecentObtained, Trial } from '@/lib/types/eureka'
import CollectionCharts from './collection-charts'
import RecentUpdates from './recent-updates'

export default function EurekaStats({
  user_id,
  eurekaSets,
  trials,
  recentObtained,
}: {
  user_id: boolean
  eurekaSets: EurekaSet[]
  trials: Trial[]
  recentObtained: RecentObtained[]
}) {
  return (
    <>
      {user_id && <CollectionCharts eurekaSets={eurekaSets || []} trials={trials || []} />}
      {user_id && <RecentUpdates items={recentObtained || []} />}
    </>
  )
}
