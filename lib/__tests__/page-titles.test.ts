import { describe, expect, it } from 'vitest'
import { PAGE_NAMES, navLabel, pageTitle, resolveNavLabel } from '../page-titles'

describe('page name registry', () => {
  it('falls back to the nav label when no longer title is set', () => {
    expect(pageTitle('/makeup')).toBe('Makeup')
    expect(navLabel('/makeup')).toBe('Makeup')
  })

  it('uses the longer title where nav and title deliberately differ', () => {
    // These three drifted when the names lived in two places; the split fields
    // preserve both readings on purpose.
    expect(navLabel('/eureka')).toBe('Eureka')
    expect(pageTitle('/eureka')).toBe('Eureka Sets')

    expect(navLabel('/seasons')).toBe('Seasons')
    expect(pageTitle('/seasons')).toBe('Outfits by Season')

    expect(navLabel('/admin/outfits/variants')).toBe('Variants')
    expect(pageTitle('/admin/outfits/variants')).toBe('Outfit Variants')
  })

  it('has no entry whose title merely repeats its nav label', () => {
    // A redundant `title` is drift waiting to happen — the fallback covers it.
    // Widened to string first: `as const` narrows each entry to its own literal
    // type, so TS otherwise rejects the comparison as provably never equal.
    const entries: [string, { nav: string; title?: string }][] = Object.entries(PAGE_NAMES)
    const redundant = entries.filter(([, v]) => v.title === v.nav).map(([k]) => k)
    expect(redundant).toEqual([])
  })
})

describe('resolveNavLabel', () => {
  it('resolves an exact route', () => {
    expect(resolveNavLabel('/settings')).toBe('Settings')
    expect(resolveNavLabel('/admin/eureka/trials')).toBe('Trials')
  })

  it('resolves add/edit routes to their registered names', () => {
    expect(resolveNavLabel('/admin/outfits/sets/new')).toBe('Add Outfit Set')
    expect(resolveNavLabel('/admin/eureka/trials/new')).toBe('Add Trial')
  })

  it('matches a dynamic segment without an entry per record', () => {
    expect(resolveNavLabel('/admin/outfits/sets/edit/anything')).toBe('Edit Outfit Set')
    expect(resolveNavLabel('/admin/feedback/1234')).toBe('Feedback detail')
  })

  it('names a detail page from its own slug', () => {
    expect(resolveNavLabel('/seasons/spring-encore')).toBe('Spring Encore')
    expect(resolveNavLabel('/eureka/some_set_name')).toBe('Some Set Name')
  })

  it('handles a trailing slash and the root', () => {
    expect(resolveNavLabel('/settings/')).toBe('Settings')
    expect(resolveNavLabel('/')).toBe('Home')
  })

  it('never returns an empty label for an unknown route', () => {
    expect(resolveNavLabel('/not/a/real/route')).toBe('Route')
  })
})
