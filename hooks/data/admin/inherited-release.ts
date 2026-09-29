import { createClient } from '@/lib/supabase/server'
import { earliestRelease, resolveRelease, type Release } from '@/hooks/release'
import { firstLinked } from '@/lib/types/outfit'
import { STANDALONE_PIECES_SLUG } from '@/lib/variant-slug'
import { STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'

export type InheritedKind =
  | 'outfitSet'
  | 'evolution'
  | 'outfitVariant'
  | 'makeupVariant'
  | 'makeupSet'
  | 'eurekaSet'
  | 'momoCloak'

const REL = 'released_at, version'

/**
 * What a row's blank override would resolve to — everything ABOVE the row in
 * its chain, never the row itself. Admin-only, a few small queries per edit
 * page; not used on any public read path.
 */
export async function getInheritedRelease(
  kind: InheritedKind,
  slug: string
): Promise<Release | null> {
  const supabase = await createClient()

  const season = async (seasonSlug: string | null) => {
    if (!seasonSlug) return null
    const { data } = await supabase.from('seasons').select(REL).eq('slug', seasonSlug).maybeSingle()
    return data
  }

  // A set row → (base set if it is an evolution) → season.
  const setChain = async (table: 'outfit_sets' | 'makeup_sets', setSlug: string | null) => {
    if (!setSlug) return null
    const { data: set } = await supabase
      .from(table)
      .select(`${REL}, seasons, base_set`)
      .eq('slug', setSlug)
      .maybeSingle()
    if (!set) return null
    const { data: base } = set.base_set
      ? await supabase.from(table).select(`${REL}, seasons`).eq('slug', set.base_set).maybeSingle()
      : { data: null }
    return resolveRelease(set, base, await season(base?.seasons ?? set.seasons))
  }

  switch (kind) {
    case 'outfitSet':
    case 'momoCloak': {
      const table = kind === 'outfitSet' ? 'outfit_sets' : 'momo_cloaks'
      const { data } = await supabase.from(table).select('seasons').eq('slug', slug).maybeSingle()
      return resolveRelease(await season(data?.seasons ?? null))
    }
    // Unlike outfit sets (whose edit page only ever loads a base_set IS NULL
    // row — evolutions go through the separate `evolution` kind above), the
    // makeup set edit form edits base AND evolution rows through this same
    // kind. An evolution's blank override must fall back to its base set
    // (then that base's season), never its own season column directly.
    case 'makeupSet': {
      const { data } = await supabase
        .from('makeup_sets')
        .select('base_set, seasons')
        .eq('slug', slug)
        .maybeSingle()
      if (data?.base_set) return setChain('makeup_sets', data.base_set)
      return resolveRelease(await season(data?.seasons ?? null))
    }
    case 'evolution': {
      const { data } = await supabase
        .from('outfit_sets')
        .select('base_set')
        .eq('slug', slug)
        .maybeSingle()
      return setChain('outfit_sets', data?.base_set ?? null)
    }
    case 'outfitVariant':
    case 'makeupVariant': {
      const table = kind === 'outfitVariant' ? 'outfit_variants' : 'makeup_variants'
      const setColumn = kind === 'outfitVariant' ? 'outfit_set' : 'makeup_set'
      const standaloneSlug =
        kind === 'outfitVariant' ? STANDALONE_PIECES_SLUG : STANDALONE_MAKEUP_SLUG
      const { data } = await supabase
        .from(table)
        .select(`${setColumn}, seasons`)
        .eq('slug', slug)
        .maybeSingle()
      const row = data as Record<string, string | null> | null
      const setSlug = row?.[setColumn] ?? null
      // Standalone pieces live in a container set with no season — they inherit
      // straight from their own season column.
      if (!setSlug || setSlug === standaloneSlug)
        return resolveRelease(await season(row?.seasons ?? null))
      return setChain(kind === 'outfitVariant' ? 'outfit_sets' : 'makeup_sets', setSlug)
    }
    case 'eurekaSet': {
      const { data } = await supabase
        .from('eureka_set_trials')
        .select('trials ( released_at, version )')
        .eq('eureka_set', slug)
      return earliestRelease((data ?? []).map((link) => firstLinked(link.trials)))
    }
  }
}
