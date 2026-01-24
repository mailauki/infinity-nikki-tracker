import { handleObtained } from "@/app/(tracker)/eureka/actions";
import { Button } from "@/components/ui/button";
import { EurekaColor } from "@/lib/types/types";
import { Check } from "lucide-react";
import Image from "next/image"
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function EurekaButton({ color } : { color: EurekaColor }) {
	return (
		<Card key={color.slug} className={`${(color.obtained === true) ? "bg-background": "bg-card"}`}>
		<Button
			variant="ghost"
			onClick={() => handleObtained(color.slug)}
			className="w-full h-full relative"
		>
			{color.image_url && (
				<Image
					src={color.image_url}
					alt={color.slug}
					width={100}
					height={100}
				/>
			)}
			<div className="absolute left-2 bottom-2">
				<Badge variant="outline">
					{color.slug.split("-").slice(1).join(" • ")}
				</Badge>
			</div>
			<div className="absolute right-2 top-2">
				{(color.obtained === true) && (
					<Badge className="p-1 rounded-full" variant="outline">
						<Check className="size-4" strokeWidth={3} />
					</Badge>
				)}
			</div>
		</Button>
		</Card>
	)
}