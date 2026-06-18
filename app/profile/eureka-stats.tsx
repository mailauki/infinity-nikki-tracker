import { EurekaSet, RecentObtained, Trial } from '@/lib/types/eureka'
import EurekaCollectionCharts from './eureka-collection-charts'
import EurekaRecentUpdates from './eureka-recent-updates'

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
      {user_id && <EurekaCollectionCharts eurekaSets={eurekaSets || []} trials={trials || []} />}
      {user_id && <EurekaRecentUpdates items={recentObtained || []} />}
    </>
  )
}
