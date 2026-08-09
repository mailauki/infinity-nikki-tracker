import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { ADMIN_ENTITIES, ADMIN_ENTITY_KEYS, type AdminEntityKey } from '@/lib/admin-entities'

export interface AdminStat {
  key: AdminEntityKey
  title: string
  total: number
  /** null = field not tracked for this entity (e.g. abilities have no image). */
  noTitle: number | null
  noImage: number | null
  noDescription: number | null
  /** Rows missing ANY tracked field. NOT noTitle + noImage — a row can lack both. */
  gaps: number
  complete: number
  percentComplete: number
  addHref?: string
  listHref: string
}

// Auth-dependent (createClient reads cookies), so React cache(), not `use cache`.
export const getAdminStats = cache(async (): Promise<AdminStat[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('admin_entity_stats')
    .select('entity, total, no_title, no_image, no_description, gaps')

  if (error) throw error

  const byKey = new Map((data ?? []).map((r) => [r.entity as AdminEntityKey, r]))

  return ADMIN_ENTITY_KEYS.map((key) => {
    const e = ADMIN_ENTITIES[key]
    const row = byKey.get(key)
    const total = row?.total ?? 0
    const gaps = row?.gaps ?? 0
    const complete = total - gaps
    return {
      key,
      title: e.title,
      total,
      noTitle: e.tracksTitle ? (row?.no_title ?? 0) : null,
      noImage: e.tracksImage ? (row?.no_image ?? 0) : null,
      noDescription: e.tracksDescription ? (row?.no_description ?? 0) : null,
      gaps,
      complete,
      percentComplete: total === 0 ? 100 : Math.round((complete / total) * 100),
      addHref: e.addHref,
      listHref: e.listHref,
    }
  })
})
