"use client"

import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import { EurekaSet } from "@/lib/types/types"
import { useEffect, useState } from "react"
import EurekaTable from "./eureka-table"
import { Card, CardContent } from "./ui/card"
import EurekaHeader from "./eureka-header"
import { SparkleIcon } from "lucide-react"
import { Badge } from "./ui/badge"

type Obtained = Tables<'obtained'>

const supabase = createClient()

export default function RealtimeEurekaSet({
	serverEurekaSet,
	serverObtained,
}: {
	serverEurekaSet: EurekaSet,
	serverObtained: Obtained[],
}) {
	const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
	const [obtained, setObtained] = useState(serverObtained)

	function isObtained(slug: string) {
		const splitSlug = slug.split("-")
		const eureka = splitSlug[0].replace("_", " ")
		const category = splitSlug[1]
		const color = splitSlug[2]
		
		return obtained?.find((item) => item.eureka === eureka && item.color === color && item.category === category) ? true : false
	}
	
	useEffect(() => {
		const obtainedChannel = supabase.channel('obtained-insert-channel')
		.on(
			'postgres_changes',
			{ event: 'INSERT', schema: 'public', table: 'obtained' },
			(payload) => {
				setObtained([...obtained, payload.new as Obtained])
			}
		)
		.on(
			'postgres_changes',
			{ event: 'DELETE', schema: 'public', table: 'obtained' },
			(payload) => {
				setObtained(obtained.filter((item) => item.id !== payload.old.id))
			}
		)
		.subscribe()

		const updatedEurekaSet = Object.assign({
			...eurekaSet,
			obtained: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
			total: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
			categories: eurekaSet.categories.map((category) => Object.assign(
				{
					...category,
					colors: category.colors.map((color) => Object.assign(
						{
							...color,
							obtained: isObtained(`${eurekaSet.name.replace(" ", "_")}-${category.name}-${color.name}`)
						}
					))
				}
			))
		}) as EurekaSet

		setEurekaSet(updatedEurekaSet)
		
		return () => {
			supabase.removeChannel(obtainedChannel)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [obtained])

	return (
		<>
			<Card className="relative">
				<EurekaHeader name={eurekaSet.name} image={eurekaSet.image_url} />
				<CardContent className="w-full p-4 flex flex-col gap-4">
					<div className="flex items-center gap-1">
						{Array.from({ length: eurekaSet.quality }, (_, index) => (
							<SparkleIcon
								key={index}
								color="var(--card-foreground)"
								fill="var(--card-foreground)"
								size={14}
							/>
						))}
					</div>
				</CardContent>
				<div className="absolute right-2 top-2">
					<Badge variant="outline">{eurekaSet.labels}</Badge>
				</div>
			</Card>
			<EurekaTable
				eurekaSet={eurekaSet!}
			/>
		</>
	)
}