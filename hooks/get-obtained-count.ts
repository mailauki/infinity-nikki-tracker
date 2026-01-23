import { EurekaSet, Quantity } from "@/lib/types/types";

export function getObtainedSetCount(eurekaSet: EurekaSet) {
	const obtainedCount = Object.assign({
		name: eurekaSet.name,
		trial: eurekaSet.trial,
		obtained: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
		total: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
		colors: eurekaSet.colors.map((eurekaColor) => Object.assign({
			name: eurekaColor.name,
			obtained: eurekaSet.categories.map((category) => category.colors.filter((color) => color.name === eurekaColor.name)).flat().filter((value) => value.obtained === true).length,
			total: eurekaSet.categories.map((category) => category.colors.filter((color) => color.name === eurekaColor.name)).flat().length
		})),
		categories: eurekaSet.categories.map((category) => Object.assign({
			name: category.name,
			obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
			total: category.colors.length,
		}))
	}) as Quantity

	return obtainedCount
}

export function getObtainedSetsCount(eurekaSets: EurekaSet[]) {
	const obtainedCount = eurekaSets.map((eurekaSet) => Object.assign({
		name: eurekaSet.name,
		trial: eurekaSet.trial,
		obtained: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
		total: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
		colors: eurekaSet.colors.map((eurekaColor) => Object.assign({
			name: eurekaColor.name,
			obtained: eurekaSet.categories.map((category) => category.colors.filter((color) => color.name === eurekaColor.name)).flat().filter((value) => value.obtained === true).length,
			total: eurekaSet.categories.map((category) => category.colors.filter((color) => color.name === eurekaColor.name)).flat().length
		})),
		categories: eurekaSet.categories.map((category) => Object.assign({
			name: category.name,
			obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
			total: category.colors.length,
		}))
	})) as Quantity[]

	return obtainedCount
}