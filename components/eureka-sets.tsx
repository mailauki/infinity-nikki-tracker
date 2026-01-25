import { getEurekaSets } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getUser } from "@/hooks/get-user"
import RealtimeEurekaSets from "./realtime-eureka-sets"

export default async function EurekaSets() {
	const user = await getUser()
	const obtained = await getObtained(user!)
	const eurekaSets = await getEurekaSets(obtained!)

	return (
		<>
			<RealtimeEurekaSets
				serverEurekaSets={eurekaSets}
				serverObtained={obtained||[]}
			/>
		</>
	)
}