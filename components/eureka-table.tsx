"use client"

import { EurekaSet } from "@/lib/types/types"
import { getObtainedSetCount } from "@/hooks/get-obtained-count"
import EurekaButton from "./eureka-button"
import ProgressCard from "./progress-card"

export default function EurekaTable({
	eurekaSet,
} : {
	eurekaSet: EurekaSet,
}) {
	const obtainedSetCount = getObtainedSetCount(eurekaSet)
	const obtainedCategories = obtainedSetCount.categories.map((category) => (
		Object.assign({
			...category,
			image_url: eurekaSet.categories.find((setItem) => setItem.name === category.name)?.image_url,
		})
	))
	const obtainedColors = obtainedSetCount.colors.map((color) => (
		Object.assign({
			...color,
			image_url: eurekaSet.colors.find((setItem) => setItem.name === color.name)?.image_url,
		})
	))

	return (
		<>
			<div className="grid grid-cols-3 gap-4">
				{obtainedCategories.map((category) => (
					<ProgressCard
						key={category.name}
						item={category}
					/>
				))}
			</div>
			<div className="grid grid-cols-3 md:grid-cols-5 gap-4">
				{obtainedColors.map((color) => (
					<ProgressCard
						key={color.name}
						item={color}
						imageSize={20}
					/>
				))}
			</div>
			<div className="grid grid-flow-col grid-cols-3 grid-rows-5 gap-4 pb-16">
				{eurekaSet.categories.map((category) => (
					category.colors.map(color => (
						<EurekaButton key={color.slug} color={color} />
					))
				))}
			</div>
		</>
	)
}
