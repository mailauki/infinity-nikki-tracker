import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImagePicker from '@/components/feedback/image-picker'
import { MAX_IMAGES } from '@/lib/types/feedback'

function makeFile(name: string, sizeBytes = 1024, type = 'image/png') {
  const file = new File([new Uint8Array(sizeBytes)], name, { type })
  return file
}

function makeOversizedFile(name: string) {
  const file = makeFile(name)
  // Faking a 5MB+ buffer would slow the test down for no benefit — just
  // stub the size the component actually reads.
  Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })
  return file
}

describe('ImagePicker', () => {
  beforeEach(() => {
    // jsdom has no object URL support; the component's useEffect calls both
    // on every files change, so both need a stub or it throws. Stubbing the
    // methods directly (rather than replacing the whole URL global) keeps
    // URL usable as a constructor elsewhere.
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the add button and the default caption', () => {
    render(<ImagePicker files={[]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /add screenshots/i })).toBeInTheDocument()
    expect(screen.getByText(/optional\. up to 3 images, 5mb each\./i)).toBeInTheDocument()
  })

  it('calls onChange with the picked file when one valid file is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ImagePicker files={[]} onChange={onChange} />)

    const file = makeFile('shot.png')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(onChange).toHaveBeenCalledWith([file])
  })

  it('truncates to the remaining room and surfaces the cap message when picking beyond MAX_IMAGES', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const existing = [makeFile('a.png'), makeFile('b.png')]
    render(<ImagePicker files={existing} onChange={onChange} />)

    // Only 1 slot of room remains (MAX_IMAGES=3, 2 already attached), but 2
    // more are picked.
    const picked = [makeFile('c.png'), makeFile('d.png')]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, picked)

    expect(onChange).toHaveBeenCalledWith([...existing, picked[0]])
    expect(await screen.findByText(/you can attach up to 3 images\./i)).toBeInTheDocument()
  })

  it('rejects a file over MAX_IMAGE_BYTES and surfaces the size message', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ImagePicker files={[]} onChange={onChange} />)

    const tooBig = makeOversizedFile('huge.png')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, tooBig)

    expect(onChange).not.toHaveBeenCalled()
    expect(await screen.findByText(/each image must be under 5mb\./i)).toBeInTheDocument()
  })

  it('surfaces both messages when a pick is both oversized and beyond the room cap', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    // 2 slots of room remain; pick 3 files, one of which is oversized.
    const existing = [makeFile('a.png')]
    render(<ImagePicker files={existing} onChange={onChange} />)

    const picked = [makeOversizedFile('huge.png'), makeFile('b.png'), makeFile('c.png')]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, picked)

    const message = await screen.findByText(/each image must be under 5mb\./i)
    expect(message).toHaveTextContent(/you can attach up to 3 images\./i)
  })

  it('renders two same-named files without a duplicate-key warning', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onChange = vi.fn()

    const files = [makeFile('screenshot.png'), makeFile('screenshot.png')]
    const { rerender } = render(<ImagePicker files={[]} onChange={onChange} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)
    rerender(<ImagePicker files={files} onChange={onChange} />)

    const keyWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).toLowerCase().includes('key')
    )
    expect(keyWarning).toBe(false)

    consoleError.mockRestore()
  })

  it('calls onChange with the file removed when its remove button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const files = [makeFile('a.png'), makeFile('b.png')]
    render(<ImagePicker files={files} onChange={onChange} />)

    const removeButton = await screen.findByRole('button', { name: /remove a\.png/i })
    await user.click(removeButton)

    expect(onChange).toHaveBeenCalledWith([files[1]])
  })

  it('disables the add button once files.length reaches MAX_IMAGES', () => {
    const files = Array.from({ length: MAX_IMAGES }, (_, i) => makeFile(`${i}.png`))
    render(<ImagePicker files={files} onChange={() => {}} />)

    // MUI's component="label" Button renders a <label role="button">, not a
    // real <button>, so disabled state shows up as aria-disabled rather than
    // the native disabled attribute toBeDisabled() checks for.
    expect(screen.getByRole('button', { name: /add screenshots/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
