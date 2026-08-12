import type { Tables } from '@/lib/types/supabase'

export type Feedback = Tables<'feedback'>
export type FeedbackImage = Tables<'feedback_images'>

export type FeedbackType = 'feature' | 'issue'
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'declined'

export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = [
  'new',
  'in_progress',
  'resolved',
  'declined',
]

export const FEATURE_CATEGORIES = ['New feature', 'Improvement', 'Other'] as const
export const ISSUE_CATEGORIES = ['Bug report', 'Missing content', 'Other'] as const

export function categoriesFor(type: FeedbackType): readonly string[] {
  return type === 'feature' ? FEATURE_CATEGORIES : ISSUE_CATEGORIES
}

// Limits mirrored by the server; the form uses them for inline validation so
// users see the cap before submitting rather than after a 400.
export const MAX_TITLE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface ReportContext {
  page_path: string
  entity_type: string | null
  entity_slug: string | null
  entity_title: string | null
}
