import { CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function EurekaHeader({
	name, image,
}: {
	name: string,
	image: string,
}) {
	return (
		<CardHeader className="w-full p-4 pb-0">
			<Image
				src={image}
				alt={name}
				width={100}
				height={100}
			/>
			<CardTitle>{name}</CardTitle>
		</CardHeader>
	)
}