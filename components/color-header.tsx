import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import Image from "next/image"

export default function ColorHeader({
	name, image,
} : {
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
						width={20}
						height={20}
					/>
				)}
			</ItemMedia>
			<ItemContent>
				{name}
			</ItemContent>
		</Item>
	)
}