import { OutfitSet, RecentObtainedOutfit, Season } from '@/lib/types/outfit'
import OutfitCollectionCharts from './outfit-collection-charts'
import OutfitRecentUpdates from './outfit-recent-updates'

export default function OutfitStats({
  user_id,
  outfitSets,
  seasons,
  recentObtained,
}: {
  user_id: boolean
  outfitSets: OutfitSet[]
  seasons: Season[]
  recentObtained: RecentObtainedOutfit[]
}) {
  return (
    <>
      {user_id && <OutfitCollectionCharts outfitSets={outfitSets || []} seasons={seasons || []} />}
      {user_id && <OutfitRecentUpdates items={recentObtained || []} />}
    </>
  )
}
