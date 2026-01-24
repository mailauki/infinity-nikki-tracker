import ProgressCard from "@/components/progress-card"
import { getEurekaSets } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getObtainedSetsCount } from "@/hooks/get-obtained-count"
import { getTrials } from "@/hooks/get-trials"
import { getUser } from "@/hooks/get-user"
import { Count, EurekaSet } from "@/lib/types/types"
import EurekaSetCard from "./eureka-set-card"


export default async function Trials() {
	const user = await getUser()
	const obtained = await getObtained(user!)
	const eurekaSets = await getEurekaSets(obtained!)
	const trials = await getTrials()
	const obtainedSetsCount = getObtainedSetsCount(eurekaSets)
	
	const totalTrials = trials!.map((trial) => (
		Object.assign({
			...trial,
			obtained: obtainedSetsCount.filter((eurekaSet) => eurekaSet.trial === trial.name).map((eurekaSet) => eurekaSet.obtained).reduce((total, current) => total + current),
			total: obtainedSetsCount.filter((eurekaSet) => eurekaSet.trial === trial.name).map((eurekaSet) => eurekaSet.total).reduce((total, current) => total + current),
			eurekaSets: eurekaSets.filter((eurekaSet) => eurekaSet.trial === trial.name)
		})
	)) as Count[]

	return (
		<div className="p-4">
			{totalTrials.map((trial) => (
				<div key={trial.name} className="pb-4">
					<ProgressCard
						key={trial.name}
						item={trial}
					/>
					<div className="grid grid-cols-2 gap-4 py-4">
						{trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
							<EurekaSetCard
								key={`${trial.name}-${eurekaSet.name}`}
								eurekaSet={eurekaSet}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}