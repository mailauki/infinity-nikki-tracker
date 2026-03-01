import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export function toVariantSlug(eurekaSet: string, category: string, color: string) {
  return [eurekaSet, category, color]
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '_'))
    .join('-')
}
