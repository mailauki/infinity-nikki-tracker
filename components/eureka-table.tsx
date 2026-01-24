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
import { percent } from "@/hooks/count"
import { EurekaSet } from "@/lib/types/types"
import { getObtainedSetCount } from "@/hooks/get-obtained-count"
import ProgressBadge from "./progress-badge"
import EurekaButton from "./eureka-button"
import ColorHeader from "./color-header"
import CategoryHeader from "./category-header"

export default function EurekaTable({
	eurekaSet,
} : {
	eurekaSet: EurekaSet,
}) {
	const obtainedSetCount = getObtainedSetCount(eurekaSet)

	return (
		<>
		{/* <div className="grid grid-flow-col grid-cols-2 md:grid-cols-4 grid-rows-5 gap-4 p-4">
				<Item className="flex-col justify-end">
					<ItemContent>
						Colors
					</ItemContent>
				</Item>
				{eurekaSet.colors.map((color) => (
					<ColorHeader
						key={color.name}
						name={color.name}
						image={color.image_url}
					/>
				))}
				{eurekaSet.categories.map(category => (
						<CategoryHeader
							key={category.name}
							name={category.name}
							image={category.image_url}
						/>
				))}
				{eurekaSet.categories.map((category) => (
					category.colors.map(color => (
						<Card key={color.slug} className="w-fit m-2">
							<EurekaButton color={color} />
						</Card>
					))
				))}
			</div> */}
		<Table className="text-center">
			<TableHeader>
				<TableRow>
					<TableHead className="text-center align-bottom p-4">
						{eurekaSet.name}
					</TableHead>
					{eurekaSet.categories.map((category) => (
						<TableHead key={category.name} className="text-center">
							<CategoryHeader name={category.name} image={category.image_url} />
						</TableHead>
					))}
					<TableHead className="text-center align-bottom p-4">Total</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{eurekaSet.colors.map((color) => (
					<TableRow key={color.name}>
						<TableCell>
							<ColorHeader
								name={color.name}
								image={color.image_url}
							/>
						</TableCell>
						{eurekaSet.categories.map((category) => category.colors.find((eureka) => eureka.name === color.name)).map((eureka) => (
							<TableCell key={eureka?.slug}>
								<EurekaButton color={eureka!} />
							</TableCell>
						))}
						<TableCell>
							<div className="flex flex-col justify-between items-center">
								<ProgressBadge percentage={percent(obtainedSetCount.colors.find((countColor) => countColor.name === color.name)!.obtained, obtainedSetCount.colors.find((countColor) => countColor.name === color.name)!.total)} />
								{percent(obtainedSetCount.colors.find((countColor) => countColor.name === color.name)!.obtained, obtainedSetCount.colors.find((countColor) => countColor.name === color.name)!.total)}%
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
			<TableFooter>
				<TableHead className="text-center">Total</TableHead>
				{eurekaSet.categories.map((category) => (
					<TableCell key={category.name}>
						<div className="flex flex-col justify-between items-center">
							<ProgressBadge percentage={percent(obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.obtained, obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.total)} />
							{percent(obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.obtained, obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.total)}%
						</div>
					</TableCell>
				))}
				<TableCell />
			</TableFooter>
		</Table>
		{/* <Table>
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
							<ProgressBadge percentage={percent(obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.obtained, obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.total)} />
							{percent(obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.obtained, obtainedSetCount.categories.find((countCategory) => countCategory.name === category.name)!.total)}%
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
		</Table> */}
		</>
	)
}
