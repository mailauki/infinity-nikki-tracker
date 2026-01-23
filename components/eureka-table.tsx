"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Item, ItemContent, ItemMedia } from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Check } from "lucide-react"
import { handleObtained } from "@/app/(tracker)/eureka/actions"
import { percent } from "@/hooks/count"
import { EurekaSet } from "@/lib/types/types"
import { getObtainedSetCount } from "@/hooks/get-obtained-count"
import ProgressBadge from "./progress-badge"

export default function EurekaTable({
	eurekaSet,
} : {
	eurekaSet: EurekaSet,
}) {
	const obtainedSetCount = getObtainedSetCount(eurekaSet)

	return (
		<>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="text-center">{eurekaSet.name}</TableHead>
					{eurekaSet.colors.map((color) => (
						<TableHead key={color.name} className="text-center">
							{color.name}
						</TableHead>
					))}
					<TableHead className="text-center">Total</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{eurekaSet.categories.map((category) => (
					<TableRow key={category.name}>
						<TableHead>
								<Item className="flex-col">
									<ItemMedia>
										{category.image_url && <Image
											src={category.image_url}
											alt={category.name}
											width={60}
											height={60}
											className="grayscale brightness-[0.4] dark:filter-none"
										/>}
									</ItemMedia>
									<ItemContent>
										{category.name}
									</ItemContent>
								</Item>
						</TableHead>
						{category.colors.map((color) => (
							<TableCell key={color.slug}>
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
							</TableCell>
						))}

					<TableCell key={category.name} className="text-center">
						<div className="flex flex-col justify-between items-center">
							<ProgressBadge percentage={percent(obtainedSetCount.categories.find((value) => value.name === category.name)!.obtained, obtainedSetCount.categories.find((value) => value.name === category.name)!.total)} />
							{percent(obtainedSetCount.categories.find((value) => value.name === category.name)!.obtained, obtainedSetCount.categories.find((value) => value.name === category.name)!.total)}%
						</div>
					</TableCell>
					</TableRow>
				))}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableHead className="text-center">Total</TableHead>
					{obtainedSetCount.colors.map((color) => (
						<TableCell
							key={color.name}
							className="text-center"
						>
							<div className="flex flex-col justify-between items-center">
								<ProgressBadge percentage={percent(color.obtained, color.total)} />
								{percent(color.obtained, color.total)}%
							</div>
						</TableCell>
					))}
					<TableCell />
				</TableRow>
			</TableFooter>
		</Table>
		</>
	)
}
