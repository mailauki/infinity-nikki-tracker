import { Badge } from "@/components/ui/badge";

export default function ProgressBadge({ percentage }: { percentage: number }) {
	return (
		<Badge
			variant={percentage === 100 ? "default" : "secondary"}
			className="flex gap-1 rounded-lg text-md w-fit"
		>
			{percentage === 100 ? "Complete" : "Unfinished"}
		</Badge>
	)
}