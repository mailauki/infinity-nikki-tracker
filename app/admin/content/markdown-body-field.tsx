'use client'

import { Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { FieldValues } from '@/lib/types/form-fields'
import { MarkdownBody } from '@/components/markdown-body'

// Markdown textarea with a live preview rendered exactly as the public page
// renders it (components/markdown-body.tsx).
export function MarkdownBodyField({
  name,
  label,
  values,
  setValue,
}: {
  name: string
  label?: string
  values: FieldValues
  setValue: (name: string, value: unknown) => void
}) {
  const markdown = String(values[name] ?? '')
  const layout = String(values.layout ?? 'prose')

  return (
    <Stack spacing={2}>
      <TextField
        multiline
        helperText={
          layout === 'cards'
            ? 'Markdown. Each "### Heading" starts a new card.'
            : 'Markdown: [link text](https://…), **bold**, "- " bullets, "1. " numbered steps, "### " subheading.'
        }
        label={label}
        minRows={8}
        name={name}
        value={markdown}
        onChange={(e) => setValue(name, e.target.value)}
      />
      <Card variant="outlined">
        <CardContent>
          <Typography color="textSecondary" size="small" sx={{ mb: 1 }} variant="label">
            Preview
          </Typography>
          <Stack spacing={1}>
            <MarkdownBody layout={layout} markdown={markdown} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
