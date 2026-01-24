import {
	Item,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemHeader,
	ItemMedia,
	ItemTitle
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { percent } from "@/hooks/count";
import { getObtainedSetCount } from "@/hooks/get-obtained-count";
import { EurekaSet } from "@/lib/types/types";
import ProgressBadge from "./progress-badge";
import Image from "next/image";
import QualityStars from "./quality-stars";

export default function EurekaHeader({
	eurekaSet, variant="default",
}: {
	eurekaSet: EurekaSet,
	variant?: "default"|"large"
}) {
	const obtainedSetCount = getObtainedSetCount(eurekaSet)
	const percentage = obtainedSetCount ? percent(obtainedSetCount!.obtained, obtainedSetCount!.total) : 0

  return (
		<Item className="relative">
			<ItemHeader>
				<ItemMedia>
					{eurekaSet.image_url && (
						<Image
							src={eurekaSet.image_url}
							alt={eurekaSet.name}
							width={100}
							height={100}
						/>
					)}
				</ItemMedia>
			</ItemHeader>
			{variant == "large" ? (
				<>
					<ItemContent>
						<ItemTitle>{eurekaSet.name}</ItemTitle>
						<ItemDescription>{eurekaSet.trial}</ItemDescription>
					</ItemContent>
					<ItemContent className="text-end">
						<QualityStars quality={eurekaSet.quality} />
						<ItemDescription>{eurekaSet.style}</ItemDescription>
					</ItemContent>
				</>
				) : (
				<ItemContent>
					<ItemTitle>{eurekaSet.name}</ItemTitle>
					<QualityStars quality={eurekaSet.quality} />
				</ItemContent>
			)}
			<ItemFooter>
				{obtainedSetCount && (
					<div className="flex flex-1 justify-between items-center gap-2">
						<ProgressBadge percentage={percentage} />
						<ItemDescription className="text-2xl">{percentage}%</ItemDescription>
					</div>
				)}
			</ItemFooter>
				<div className="absolute right-2 top-2">
					<Badge variant="outline">{eurekaSet.labels}</Badge>
				</div>
		</Item>
  )
}