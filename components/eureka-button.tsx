import { handleObtained } from "@/app/(tracker)/eureka/actions";
import { Button } from "@/components/ui/button";
import { EurekaColor } from "@/lib/types/types";
import { Check } from "lucide-react";
import Image from "next/image"

export default function EurekaButton({ color } : { color: EurekaColor }) {
	return (
		<Button
			variant="ghost"
			onClick={() => handleObtained(color.slug)}
			className="h-fit relative"
		>
			{color.image_url && <Image
				src={color.image_url}
				alt={color.slug}
				width={100}
				height={100}
			/>}
			<div className="absolute right-2 top-2">
				{(color.obtained === true) && <Check className="size-3" />}
			</div>
		</Button>
	)
}