import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReportIssueLink from '@/components/feedback/report-issue-link'
import { ReportSubjectProvider } from '@/components/feedback/report-context'

vi.mock('next/navigation', () => ({
  usePathname: () => '/eureka/blossoming_dream',
}))

// FeedbackForm renders inside the dialog and resolves auth on mount.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))

describe('ReportIssueLink', () => {
  it('renders a trigger button', () => {
    render(<ReportIssueLink />)
    expect(screen.getByRole('button', { name: /report a problem/i })).toBeInTheDocument()
  })

  it('opens the dialog with the slug as the subject when no provider supplies a title', async () => {
    const user = userEvent.setup()
    render(<ReportIssueLink />)

    await user.click(screen.getByRole('button', { name: /report a problem/i }))

    expect(await screen.findByText('Reporting about')).toBeInTheDocument()
    expect(screen.getByText('blossoming_dream')).toBeInTheDocument()
  })

  it('prefers the display title published by a provider', async () => {
    const user = userEvent.setup()
    render(
      <ReportSubjectProvider title="Blossoming Dream">
        <ReportIssueLink />
      </ReportSubjectProvider>
    )

    await user.click(screen.getByRole('button', { name: /report a problem/i }))

    expect(await screen.findByText('Blossoming Dream')).toBeInTheDocument()
  })
})
