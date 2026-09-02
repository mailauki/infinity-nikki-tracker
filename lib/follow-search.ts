// Search runs client-side and interpolates user input into a PostgREST .or()
// filter string, where `,` `.` `%` and parentheses are structural. This is not
// SQL injection — PostgREST parameterizes underneath — but unescaped input can
// still alter which rows match, so strip the structural characters rather than
// trusting the query.
const STRUCTURAL = /[,.%()]/g

export function escapeFilterValue(q: string): string {
  return q.replace(STRUCTURAL, '')
}

// Case-insensitive substring match across both searchable profile fields.
export function buildProfileSearchFilter(q: string): string {
  const safe = escapeFilterValue(q)
  return `username.ilike.%${safe}%,display_name.ilike.%${safe}%`
}
