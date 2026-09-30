// The two release inputs every admin form shares. Blank means "inherit", which
// the DB stores as null; a date must already be ISO (what <input type="date">
// submits) so a hand-typed value can never reach Postgres as a cast error.
export function readReleaseFields(formData: FormData) {
  const date = ((formData.get('released_at') as string | null) ?? '').trim()
  const version = ((formData.get('version') as string | null) ?? '').trim()
  return {
    released_at: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    version: version || null,
  }
}
