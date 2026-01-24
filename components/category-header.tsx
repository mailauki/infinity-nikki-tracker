import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import Image from "next/image"

export default function CategoryHeader({
	name, image,
}: {
	name: string,
	image: string,
}) {
	return (
		<Item className="flex-col">
			<ItemMedia>
				{image && (
					<Image
						src={image}
						alt={name}
						width={60}
						height={60}
						className="grayscale brightness-[0.4] dark:filter-none"
					/>
				)}
			</ItemMedia>
			<ItemContent>
				{name}
			</ItemContent>
		</Item>
	)
}