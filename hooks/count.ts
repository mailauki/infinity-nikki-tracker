import { Count, Eureka, ObtainedCount, Quantity } from "@/lib/types/types";

export function count(array: Eureka[]) {
	return Object.assign({
		// obtained: array.filter((value) => value.obtained === value.total).length,
		// total: array.length,
		obtained: array.reduce((sum, item) => sum + (item.obtained ? 1 : 0), 0),
		total: array.length
	}) as ObtainedCount
}

export function percent(obtained: number, total: number) {
	return Number((obtained/total * 100).toPrecision(2))
}