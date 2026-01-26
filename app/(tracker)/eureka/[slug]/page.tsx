import { Suspense } from "react"
import { getEurekaSet } from "@/lib/data"
import EurekaHeader from "@/components/eureka-header"
import EurekaTable from "@/components/eureka-table"
import ProgressCard from "@/components/progress-card"

export async function generateStaticParams() {
  return [{ slug: 'hello-world' }]
}

export default async function EurekaSetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col p-6 gap-6">
			<Suspense>
				<EurekaSet slug={slug} />
			</Suspense>
    </div>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
	const eurekaSet = await getEurekaSet(slug)
	const hasObtained = Object.keys(eurekaSet.eureka[0]).includes("obtained")

	return (
		<>
			<EurekaHeader eurekaSet={eurekaSet} variant="large" />
				{hasObtained && (
					<div className="grid grid-cols-3 gap-4">
					{eurekaSet.categories.map((category) => (
						<ProgressCard
							key={`${eurekaSet.name}-${category.name}`}
							item={category}
							eureka={eurekaSet.eureka}
						/>
					))}
				</div>
			)}
			<div className="grid grid-cols-3 md:grid-cols-5 gap-4">
				{eurekaSet.colors.map((color) => (
					<ProgressCard
						key={`${eurekaSet.name}-${color.name}`}
						item={color}
						imageSize={20}
						eureka={eurekaSet.eureka}
					/>
				))}
			</div>
			<EurekaTable eurekaSet={eurekaSet} hasObtained={hasObtained} />
		</>
	)
}