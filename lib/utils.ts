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
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
}

export function toTitle(slug: string) {
  return decodeURIComponent(slug)
    .replace(/_/g, ' ')
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase())
}

export function toSlugVariant(eurekaSet: string, category: string, color: string) {
  return [eurekaSet, category, color].map((s) => toSlug(s)).join('-')
}

// Comparators that mirror the admin "Update & next item" navigation order
// (next row by title, slug tie-break; by slug for variants), so list views
// display items in the same sequence the button walks through.
export function byTitleThenSlug(
  a: { title: string | null; slug: string | null },
  b: { title: string | null; slug: string | null }
) {
  const titleCmp = (a.title ?? '').localeCompare(b.title ?? '')
  return titleCmp !== 0 ? titleCmp : (a.slug ?? '').localeCompare(b.slug ?? '')
}

export function bySlug(a: { slug: string | null }, b: { slug: string | null }) {
  return (a.slug ?? '').localeCompare(b.slug ?? '')
}

// Evolutions share a title across every stage of a set (title = set name), so
// they sort by set title then by stage order (base → evo 1 → evo 2), grouping
// each set's stages alphabetically and in sequence.
export function byTitleThenOrder(
  a: { title: string | null; order: number },
  b: { title: string | null; order: number }
) {
  const titleCmp = (a.title ?? '').localeCompare(b.title ?? '')
  return titleCmp !== 0 ? titleCmp : a.order - b.order
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
