import Trials from "@/components/trials";
import { Suspense } from "react";

export default async function TrialsPage() {
	return (
		<Suspense>
			<Trials />
		</Suspense>
	)
}