import { Eureka, ObtainedCount } from '@/lib/types/types'

export function countObtained(array: Eureka[]) {
  return {
    obtained: array.reduce((sum, item) => sum + (item.obtained ? 1 : 0), 0),
    total: array.length,
  } as ObtainedCount
}

export function percent(obtained: number, total: number) {
  return Number(((obtained / total) * 100).toPrecision(2))
}
