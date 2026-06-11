import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, '_and_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/['‘’]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
}

export function toTitle(slug: string) {
  return decodeURIComponent(slug)
    .replace(/_/g, ' ')
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase())
}

export function toSlugVariant(eurekaSet: string, category: string, color: string) {
  return [eurekaSet, category, color]
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '_'))
    .join('-')
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
