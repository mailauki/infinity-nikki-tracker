import { percent } from "@/hooks/count";
import { Category, Color, Count } from "@/lib/types/types";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ProgressCard({
	item, imageSize=60,
} : {
	item: Count,
	set?: Category[] | Color[],
	imageSize?: number,
}) {
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
				<ItemTitle className="text-lg">
					{percent(item.obtained, item.total)}%
				</ItemTitle>
			</ItemContent>
			<ItemFooter className="w-full flex-0">
				<Progress value={percent(item.obtained, item.total)} className="bg-muted" />
			</ItemFooter>
			<div className="absolute right-2 top-2">
				<Badge variant="outline">
					{item.obtained}/{item.total}
				</Badge>
			</div>
		</Item>
	)
}