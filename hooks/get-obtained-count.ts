import { Eureka, Quantity } from "@/lib/types/types";

export function getObtainedEureka(item: Eureka,) {
	const obtainedCount = Object.assign({
		name: item.name,
		trial: item.trial,
		obtained: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
		total: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
		colors: item.colors.map((itemColor) => Object.assign({
			name: itemColor.name,
			obtained: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().filter((value) => value.obtained === true).length,
			total: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().length
		})),
		categories: item.categories.map((category) => Object.assign({
			name: category.name,
			obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
			total: category.colors.length,
		}))
	}) as Quantity

	

	return obtainedCount
}

export function getObtainedCount(items: Eureka[]) {
	const obtainedCount = items.map((item) => Object.assign({
		name: item.name,
		trial: item.trial,
		obtained: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
		total: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
		colors: item.colors.map((itemColor) => Object.assign({
			name: itemColor.name,
			obtained: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().filter((value) => value.obtained === true).length,
			total: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().length
		})),
		categories: item.categories.map((category) => Object.assign({
			name: category.name,
			obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
			total: category.colors.length,
		}))
	})) as Quantity[]

	return obtainedCount
}