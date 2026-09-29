import { useEffect } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EurekaDataProvider from '@/app/eureka/eureka-data-provider'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { updateEurekaFilters } from '@/app/actions/preferences'

vi.mock('@/app/actions/preferences', () => ({
  updateEurekaFilters: vi.fn(async () => {}),
  updateGroupBySet: vi.fn(async () => {}),
  updateShowByColor: vi.fn(async () => {}),
}))
vi.mock('@/app/eureka/actions', () => ({ handleObtained: vi.fn() }))

// Realtime channel: every builder call returns the same chainable stub.
vi.mock('@/lib/supabase/client', () => {
  const channel: Record<string, unknown> = {}
  channel.on = () => channel
  channel.subscribe = () => channel
  return { createClient: () => ({ channel: () => channel, removeChannel: () => {} }) }
})

const PREFS = {
  group_by_set: true,
  show_by_color: false,
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: 'missing',
  eureka_color: null,
  eureka_rarity: '5',
  eureka_style: 'sweet',
  eureka_label: null,
  eureka_trial: null,
}

const BOOTSTRAP = {
  sets: [],
  categories: [],
  colors: [],
  trials: [],
  styles: [],
  labels: [],
  obtained: [],
}

// Captured in an effect, not during render, to keep the probe pure.
const probe: { ctx?: ReturnType<typeof useEurekaData> } = {}
function Probe() {
  const value = useEurekaData()
  useEffect(() => {
    probe.ctx = value
  })
  return null
}

describe('EurekaDataProvider filter persistence', () => {
  beforeEach(() => {
    vi.mocked(updateEurekaFilters).mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => (url === '/api/preferences' ? PREFS : BOOTSTRAP),
      }))
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does not write back the filters it just hydrated, but writes a real change', async () => {
    render(
      <EurekaDataProvider isLoggedIn userId="u1">
        <Probe />
      </EurekaDataProvider>
    )

    await waitFor(() => expect(probe.ctx?.filters.selectedRarity).toBe(5))
    // Let any post-hydrate effect / transition flush.
    await act(async () => {})
    expect(updateEurekaFilters).not.toHaveBeenCalled()

    act(() => probe.ctx!.onFiltersChange({ selectedRarity: 4 }))
    await waitFor(() => expect(updateEurekaFilters).toHaveBeenCalledTimes(1))
    expect(updateEurekaFilters).toHaveBeenCalledWith(
      expect.objectContaining({ eureka_rarity: '4', eureka_style: 'sweet' })
    )
  })
})
