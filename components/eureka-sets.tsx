import { getEurekaSets } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getUser } from "@/hooks/get-user"
import RealtimeEurekaSets from "./realtime-eureka-sets"
// import { getTrials } from "@/hooks/get-trials"

export default async function EurekaSets() {
	const user = await getUser()
	const obtained = await getObtained(user!)
	const eurekaSets = await getEurekaSets(obtained!)
	// const trials = await getTrials()

	return (
		<>
			<RealtimeEurekaSets
				serverEurekaSets={eurekaSets}
				serverObtained={obtained||[]}
				// serverTrials={trials||[]}
			/>
		</>
	)
}