import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { SeasonFilterProvider, useSeasonFilter } from '../season-filter-context'

const save: Mock<(updates: unknown) => Promise<void>> = vi.fn(() => Promise.resolve())
vi.mock('@/lib/save-preferences', () => ({ savePreferences: (u: unknown) => save(u) }))

function Probe() {
  const { hideEvolutions, density, filters, onDensityChange, onFiltersChange } = useSeasonFilter()
  return (
    <div>
      <span data-testid="evo">{String(hideEvolutions)}</span>
      <span data-testid="density">{density}</span>
      <span data-testid="rarity">{String(filters.rarity)}</span>
      <button onClick={() => onDensityChange('compact')}>density</button>
      <button onClick={() => onFiltersChange({ rarity: 5 })}>rarity</button>
    </div>
  )
}

beforeEach(() => save.mockClear())

describe('SeasonFilterProvider', () => {
  it('defaults evolutions to hidden and density to standard', () => {
    render(
      <SeasonFilterProvider isLoggedIn={false}>
        <Probe />
      </SeasonFilterProvider>
    )
    expect(screen.getByTestId('evo')).toHaveTextContent('true')
    expect(screen.getByTestId('density')).toHaveTextContent('standard')
  })

  it('hydrates from passed-in preferences', () => {
    render(
      <SeasonFilterProvider
        isLoggedIn
        preferences={{ season_hide_evolutions: false, season_density: 'compact' }}
      >
        <Probe />
      </SeasonFilterProvider>
    )
    expect(screen.getByTestId('evo')).toHaveTextContent('false')
    expect(screen.getByTestId('density')).toHaveTextContent('compact')
  })

  it('persists a density change for a signed-in user', () => {
    render(
      <SeasonFilterProvider isLoggedIn>
        <Probe />
      </SeasonFilterProvider>
    )
    act(() => screen.getByText('density').click())
    expect(save).toHaveBeenCalledWith({ season_density: 'compact' })
  })

  it('does not persist for a signed-out user', () => {
    render(
      <SeasonFilterProvider isLoggedIn={false}>
        <Probe />
      </SeasonFilterProvider>
    )
    act(() => screen.getByText('rarity').click())
    expect(save).not.toHaveBeenCalled()
    expect(screen.getByTestId('rarity')).toHaveTextContent('5')
  })
})

function ToggleProbe() {
  const { hideEureka, hideCloaks, onHideEurekaChange, onHideCloaksChange, onSetAllVisible } =
    useSeasonFilter()
  return (
    <div>
      <span data-testid="eureka">{String(hideEureka)}</span>
      <span data-testid="cloaks">{String(hideCloaks)}</span>
      <button onClick={onHideEurekaChange}>eureka</button>
      <button onClick={onHideCloaksChange}>cloaks</button>
      <button onClick={() => onSetAllVisible(false)}>hide all</button>
    </div>
  )
}

it('shows eureka and cloaks by default, and hydrates saved values', () => {
  const { unmount } = render(
    <SeasonFilterProvider isLoggedIn={false}>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  expect(screen.getByTestId('eureka')).toHaveTextContent('false')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('false')
  unmount()

  render(
    <SeasonFilterProvider
      isLoggedIn
      preferences={{ season_hide_eureka: true, season_hide_cloaks: true }}
    >
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  expect(screen.getByTestId('eureka')).toHaveTextContent('true')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('true')
})

it('toggles and persists hideEureka and hideCloaks', () => {
  render(
    <SeasonFilterProvider isLoggedIn>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  act(() => screen.getByText('eureka').click())
  act(() => screen.getByText('cloaks').click())
  expect(screen.getByTestId('eureka')).toHaveTextContent('true')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('true')
  expect(save).toHaveBeenCalledWith({ season_hide_eureka: true })
  expect(save).toHaveBeenCalledWith({ season_hide_cloaks: true })
})

it('includes eureka and cloaks in hide-all', () => {
  render(
    <SeasonFilterProvider isLoggedIn>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  act(() => screen.getByText('hide all').click())
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ season_hide_eureka: true, season_hide_cloaks: true })
  )
})
