import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LazyImage from '@/components/lazy-image'
import { resetLazyImageCache } from '@/hooks/use-lazy-image'

const SRC = 'https://example.test/images/outfit.png'

// The <img> only exists once there is something worth painting, so its presence
// is the assertion for "not showing a broken image".
function img() {
  return document.querySelector('img')
}

function skeleton() {
  return document.querySelector('.MuiSkeleton-root')
}

// Walk the retry ladder: error, wait out the backoff, error again, … The hook
// gives up after MAX_ATTEMPTS (3) requests.
async function failAttempts(count: number) {
  for (let i = 0; i < count; i += 1) {
    const el = img()
    if (!el) throw new Error(`expected an <img> for attempt ${i + 1}`)
    await act(async () => {
      el.dispatchEvent(new Event('error'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
  }
}

describe('LazyImage', () => {
  beforeEach(() => {
    resetLazyImageCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a skeleton while the image is loading, then the image', async () => {
    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)

    expect(skeleton()).toBeInTheDocument()
    expect(img()).toHaveAttribute('src', SRC)

    await act(async () => {
      img()!.dispatchEvent(new Event('load'))
    })

    expect(skeleton()).not.toBeInTheDocument()
    expect(img()).toBeInTheDocument()
  })

  it('renders the placeholder, not an <img>, when there is no src', () => {
    render(<LazyImage alt="Outfit" size="lg" />)

    expect(img()).not.toBeInTheDocument()
    expect(skeleton()).not.toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('retries a broken image and only then falls back to the placeholder', async () => {
    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)

    // First failure: the <img> is unmounted for the backoff, skeleton stays up.
    await act(async () => {
      img()!.dispatchEvent(new Event('error'))
    })
    expect(img()).not.toBeInTheDocument()
    expect(skeleton()).toBeInTheDocument()

    // Second attempt is cache-busted so a negative response isn't replayed.
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(img()).toHaveAttribute('src', `${SRC}?retry=1`)

    await failAttempts(2)

    // Out of attempts: placeholder, and never a broken <img>.
    expect(img()).not.toBeInTheDocument()
    expect(skeleton()).not.toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('remembers a failure so a remount skips straight to the placeholder', async () => {
    const first = render(<LazyImage alt="Outfit" size="lg" src={SRC} />)
    await failAttempts(3)
    expect(img()).not.toBeInTheDocument()
    first.unmount()

    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)

    // No retry ladder, no skeleton — a virtualized row scrolling back past a
    // known-dead URL costs nothing.
    expect(img()).not.toBeInTheDocument()
    expect(skeleton()).not.toBeInTheDocument()
  })

  it('remembers a success so a remount paints immediately with no skeleton', async () => {
    const first = render(<LazyImage alt="Outfit" size="lg" src={SRC} />)
    await act(async () => {
      img()!.dispatchEvent(new Event('load'))
    })
    first.unmount()

    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)

    expect(skeleton()).not.toBeInTheDocument()
    expect(img()).toHaveAttribute('src', SRC)
  })

  it('resets to loading when the src changes', async () => {
    const { rerender } = render(<LazyImage alt="Outfit" size="lg" src={SRC} />)
    await act(async () => {
      img()!.dispatchEvent(new Event('load'))
    })
    expect(skeleton()).not.toBeInTheDocument()

    rerender(<LazyImage alt="Outfit" size="lg" src={`${SRC}?alt`} />)

    expect(skeleton()).toBeInTheDocument()
    expect(img()).toHaveAttribute('src', `${SRC}?alt`)
  })

  it('clears the skeleton for an image that finished before hydration', async () => {
    // These components are server-rendered, so the browser can complete the
    // request before onLoad is ever attached. jsdom never loads anything, so
    // both properties have to be faked.
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const natural = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(1200)

    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)
    await act(async () => {})

    expect(skeleton()).not.toBeInTheDocument()
    expect(img()).toBeInTheDocument()

    complete.mockRestore()
    natural.mockRestore()
  })

  it('starts the retry ladder for an image that failed before hydration', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const natural = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0)

    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)
    await act(async () => {})

    // The pre-hydration failure counts as attempt 1 rather than leaving the
    // skeleton up forever waiting on an onError that will never fire.
    expect(img()).not.toBeInTheDocument()
    expect(skeleton()).toBeInTheDocument()

    complete.mockRestore()
    natural.mockRestore()
  })

  it('does not let MUI Avatar probe the URL with a second, non-lazy request', () => {
    // Avatar's `useLoaded` builds a detached `new Image()` for any src passed to
    // its `src` prop — a duplicate request that ignores loading="lazy". The
    // thumbnail is rendered as an Avatar child specifically to avoid that, so a
    // constructed Image here means the regression is back.
    const ImageSpy = vi.fn()
    vi.stubGlobal('Image', ImageSpy)

    render(<LazyImage alt="Outfit" size="lg" src={SRC} />)

    expect(ImageSpy).not.toHaveBeenCalled()
    expect(img()).toHaveAttribute('loading', 'lazy')
    vi.unstubAllGlobals()
  })

  it('renders the media variant placeholder with its title when there is no image', () => {
    render(<LazyImage kind="media" title="Silverplume" />)

    expect(img()).not.toBeInTheDocument()
    expect(screen.getByText('Silverplume')).toBeInTheDocument()
  })
})
