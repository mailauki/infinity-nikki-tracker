import { MomoCloak, RecentObtainedMomoCloak } from '@/lib/types/momo'
import MomoCloakCollectionCharts from './momo-cloak-collection-charts'
import MomoCloakRecentUpdates from './momo-cloak-recent-updates'

export default function MomoCloakStats({
  user_id,
  cloaks,
  recentObtained,
}: {
  user_id: boolean
  cloaks: MomoCloak[]
  recentObtained: RecentObtainedMomoCloak[]
}) {
  return (
    <>
      {user_id && <MomoCloakCollectionCharts cloaks={cloaks || []} />}
      {user_id && <MomoCloakRecentUpdates items={recentObtained || []} />}
    </>
  )
}
