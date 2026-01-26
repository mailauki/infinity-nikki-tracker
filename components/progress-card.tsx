import { count, percent } from "@/hooks/count";
import { Eureka, Total } from "@/lib/types/types";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemHeader,
	ItemMedia,
	ItemTitle
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ProgressCard({
	item, imageSize=60, eureka,
} : {
	item: Total,
	imageSize?: number,
	eureka: Eureka[]
}) {
	const hasObtained = Object.keys(eureka[0]).includes("obtained")
	const obtainedCount = count(eureka)
	const percentage = percent(obtainedCount.obtained, obtainedCount.total)

	return (
		<Item key={item.name} variant="outline" className={`${
			item.name === "Iridescent"
			? "col-start-3 row-start-1 row-end-3 md:col-start-5 md:row-end-1 order-last"
			: ""
			} relative flex-col justify-between rounded-xl`}
		>
			{item.image_url && (
				<ItemHeader className="w-full flex-0">
					<ItemMedia className={imageSize > 300 ? "w-full": "w-fit"}>
						<Image
							src={item.image_url}
							alt={item.name!}
							width={imageSize}
							height={imageSize}
							className={imageSize === 60 ? "grayscale brightness-[0.4] dark:filter-none" : "filter-none"}
						/>
					</ItemMedia>
				</ItemHeader>
			)}
			<ItemContent className="w-full flex-0 grow">
				<ItemDescription>{item.name}</ItemDescription>
				{hasObtained && (
					<ItemTitle className="text-lg">
						{percentage}%
					</ItemTitle>
				)}
			</ItemContent>
			{hasObtained && (
				<ItemFooter className="w-full flex-0">
					<Progress value={percentage} className="bg-muted" />
				</ItemFooter>
			)}
			<div className="absolute right-2 top-2">
				{hasObtained && (
					<Badge variant="outline">
						{obtainedCount.obtained}/{obtainedCount.total}
					</Badge>
				)}
			</div>
		</Item>
	)
}