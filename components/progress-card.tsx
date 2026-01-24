import { percent } from "@/hooks/count";
import { Category, Color, Count } from "@/lib/types/types";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ProgressCard({
	item, set,
} : {
	item: Count,
	set: Category[] | Color[],
}) {
	return (
		<Item key={item.name} variant="outline" className="relative">
			<ItemHeader>
				<ItemMedia>
					{set.find((setItem) => setItem.name === item.name)!.image_url && (
						<Image
							src={set.find((setItem) => setItem.name === item.name)!.image_url}
							alt={item.name!}
							width={Object.keys(set[0]).includes("colors") ? 60 : 20}
							height={Object.keys(set[0]).includes("colors") ? 60 : 20}
							className={Object.keys(set[0]).includes("colors") ? "grayscale brightness-[0.4] dark:filter-none" : "filter-none" }
						/>
					)}
				</ItemMedia>
			</ItemHeader>
			<ItemContent>
				<ItemDescription>{item.name}</ItemDescription>
				<ItemTitle className="text-lg">
					{percent(item.obtained, item.total)}%
				</ItemTitle>
			</ItemContent>
			<ItemFooter>
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