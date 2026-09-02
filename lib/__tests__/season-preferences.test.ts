import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

// Each column needs five lockstep edits; a miss shows up as a silent undefined.
// These assert the defaults exist AND carry the values the season page relies on.
const SEASON_KEYS = [
  'season_hide_evolutions',
  'season_hide_glowups',
  'season_hide_pieces',
  'season_hide_makeup',
  'season_hide_base_sets',
  'season_density',
  'season_obtained_filter',
  'season_rarity_filter',
  'season_style_filter',
] as const

describe('season preference defaults', () => {
  it.each(SEASON_KEYS)('defines a default for %s', (key) => {
    expect(DEFAULT_PREFERENCES).toHaveProperty(key)
  })

  it('hides evolutions and glow-ups by default, preserving the season page default', () => {
    expect(DEFAULT_PREFERENCES.season_hide_evolutions).toBe(true)
    expect(DEFAULT_PREFERENCES.season_hide_glowups).toBe(true)
  })

  it('shows base sets, pieces and makeup by default', () => {
    expect(DEFAULT_PREFERENCES.season_hide_base_sets).toBe(false)
    expect(DEFAULT_PREFERENCES.season_hide_pieces).toBe(false)
    expect(DEFAULT_PREFERENCES.season_hide_makeup).toBe(false)
  })

  it('defaults density to standard and the filter axes to null', () => {
    expect(DEFAULT_PREFERENCES.season_density).toBe('standard')
    expect(DEFAULT_PREFERENCES.season_obtained_filter).toBeNull()
    expect(DEFAULT_PREFERENCES.season_rarity_filter).toBeNull()
    expect(DEFAULT_PREFERENCES.season_style_filter).toBeNull()
  })
})
