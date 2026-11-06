'use client'

import { FieldConfig } from '@/lib/types/form-fields'

// Edit-only: sections are seeded by migration and the pages anchor built-in
// blocks to their slugs, so slug, page, order and layout aren't editable here.
export function pageSectionFields(): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    { type: 'custom', name: 'body', label: 'Body', component: 'markdownBody' },
  ]
}
