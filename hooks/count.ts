import { Count, Quantity } from "@/lib/types/types";

export function count(array: Quantity[]|Count[]) {
	return Object.assign({
		obtained: array.filter((value) => value.obtained === value.total).length,
		total: array.length,
	}) as Count
}

export function percent(obtained: number, total: number) {
	return Number((obtained/total * 100).toPrecision(1))
}