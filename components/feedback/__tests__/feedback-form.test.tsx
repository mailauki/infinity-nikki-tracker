import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeedbackForm from '@/components/feedback/feedback-form'

function fetchOk(body: unknown, status = 201) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => body,
  })
}

const receipt = {
  feedback: {
    type: 'issue',
    category: 'Bug report',
    title: 'Broken image',
    description: 'The thumbnail is blank.',
    page_path: null,
    entity_title: null,
    entity_slug: null,
  },
  imageNames: [],
  imagesFailed: false,
}

// The form resolves auth itself, so the browser client is mocked. `mockUser`
// is reassigned per test to switch between anonymous and signed-in.
let mockUser: { id: string } | null = null

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
  }),
}))

describe('FeedbackForm', () => {
  beforeEach(() => {
    mockUser = null
    vi.stubGlobal('fetch', fetchOk(receipt))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the issue categories for type=issue', async () => {
    render(<FeedbackForm type="issue" onClose={() => {}} />)
    expect(screen.getByLabelText(/category/i)).toHaveTextContent('Bug report')
  })

  it('shows the feature categories for type=feature', async () => {
    render(<FeedbackForm type="feature" onClose={() => {}} />)
    expect(screen.getByLabelText(/category/i)).toHaveTextContent('New feature')
  })

  it('blocks submission and shows inline errors when required fields are empty', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/please add a title/i)).toBeInTheDocument()
    expect(screen.getByText(/please describe what happened/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits and renders the receipt on success', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/thanks — we got it/i)).toBeInTheDocument()
    expect(screen.getByText('Broken image')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('surfaces a server error and stays on the form', async () => {
    vi.stubGlobal('fetch', fetchOk({ error: 'Rate limited.' }, 429))
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/rate limited/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('hides the email field for logged-in users', async () => {
    mockUser = { id: 'user-1' }
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    // Auth resolves asynchronously; wait for the anonymous case to be ruled
    // out rather than asserting on the pre-resolution render.
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toBeInTheDocument())
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
  })

  it('shows the email field for anonymous users', async () => {
    render(<FeedbackForm type="issue" onClose={() => {}} />)
    expect(await screen.findByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('renders a category error returned by the server', async () => {
    vi.stubGlobal(
      'fetch',
      fetchOk({ errors: { category: 'Choose a category from the list.' } }, 400)
    )
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/choose a category from the list/i)).toBeInTheDocument()
  })

  it('moves focus to the receipt heading and announces success on submit', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    const heading = await screen.findByRole('heading', { name: /thanks — we got it/i })
    expect(heading).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(/report submitted/i)
  })

  it('displays the captured context', () => {
    render(
      <FeedbackForm
        context={{
          page_path: '/eureka/blossoming_dream',
          entity_type: 'eureka',
          entity_slug: 'blossoming_dream',
          entity_title: 'Blossoming Dream',
        }}
        type="issue"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Reporting about')).toBeInTheDocument()
    expect(screen.getByText('Blossoming Dream')).toBeInTheDocument()
  })
})
