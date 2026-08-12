import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  categoriesFor,
  type FeedbackType,
} from '@/lib/types/feedback'

export interface SubmissionInput {
  type: string
  category: string
  title: string
  description: string
  email?: string | null
}

export interface ValidatedSubmission {
  type: FeedbackType
  category: string
  title: string
  description: string
  email: string | null
}

export type ValidationResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; errors: Record<string, string> }

// Deliberately permissive: catches typos, not RFC violations. The address is
// never trusted for anything beyond an optional receipt.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isFeedbackType(value: string): value is FeedbackType {
  return value === 'feature' || value === 'issue'
}

// Shared by the route and the form so both agree on what is acceptable —
// the client gets inline errors, the server enforces them.
export function validateSubmission(input: SubmissionInput): ValidationResult {
  const errors: Record<string, string> = {}

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim() : ''

  if (!isFeedbackType(input.type)) {
    errors.type = 'Unknown feedback type.'
  } else if (!categoriesFor(input.type).includes(input.category)) {
    errors.category = 'Choose a category from the list.'
  }

  if (!title) {
    errors.title = 'Please add a title.'
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`
  }

  if (!description) {
    errors.description = 'Please describe what happened.'
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'That email address does not look right.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      type: input.type as FeedbackType,
      category: input.category,
      title,
      description,
      email: email ? email.toLowerCase() : null,
    },
  }
}
