import { MakeupSet, RecentObtainedMakeup } from '@/lib/types/makeup'
import { Season } from '@/lib/types/outfit'
import MakeupCollectionCharts from './makeup-collection-charts'
import MakeupRecentUpdates from './makeup-recent-updates'

export default function MakeupStats({
  user_id,
  makeupSets,
  seasons,
  recentObtained,
}: {
  user_id: boolean
  makeupSets: MakeupSet[]
  seasons: Season[]
  recentObtained: RecentObtainedMakeup[]
}) {
  return (
    <>
      {user_id && <MakeupCollectionCharts makeupSets={makeupSets || []} seasons={seasons || []} />}
      {user_id && <MakeupRecentUpdates items={recentObtained || []} />}
    </>
  )
}
