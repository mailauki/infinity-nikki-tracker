import { describe, expect, it } from 'vitest'
import { entityFromPath } from '@/lib/feedback/entity-from-path'

describe('entityFromPath', () => {
  it('extracts type and slug from a detail route', () => {
    expect(entityFromPath('/eureka/blossoming_dream')).toEqual({
      entity_type: 'eureka',
      entity_slug: 'blossoming_dream',
    })
  })

  it('handles every known detail domain', () => {
    expect(entityFromPath('/outfits/ballet_dream')).toEqual({
      entity_type: 'outfits',
      entity_slug: 'ballet_dream',
    })
    expect(entityFromPath('/makeup/soft_glow')).toEqual({
      entity_type: 'makeup',
      entity_slug: 'soft_glow',
    })
    expect(entityFromPath('/momo-cloaks/starry')).toEqual({
      entity_type: 'momo-cloaks',
      entity_slug: 'starry',
    })
    expect(entityFromPath('/looks/my_look')).toEqual({
      entity_type: 'looks',
      entity_slug: 'my_look',
    })
    expect(entityFromPath('/seasons/spring')).toEqual({
      entity_type: 'seasons',
      entity_slug: 'spring',
    })
  })

  it('extracts nested detail routes', () => {
    expect(entityFromPath('/eureka/trials/pear_blossom')).toEqual({
      entity_type: 'eureka-trials',
      entity_slug: 'pear_blossom',
    })
  })

  it('returns no entity for collection index routes', () => {
    expect(entityFromPath('/eureka')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/outfits')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('returns no entity for known non-entity subpages', () => {
    expect(entityFromPath('/eureka/sets')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/eureka/trials')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/seasons')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/looks/new')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('returns no entity for unrelated routes', () => {
    expect(entityFromPath('/help')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/settings')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/admin/eureka/sets')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('ignores trailing slashes and query strings', () => {
    expect(entityFromPath('/eureka/blossoming_dream/')).toEqual({
      entity_type: 'eureka',
      entity_slug: 'blossoming_dream',
    })
  })

  it('does not treat an edit route as an entity page', () => {
    expect(entityFromPath('/looks/edit/my_look')).toEqual({
      entity_type: null,
      entity_slug: null,
    })
  })
})
