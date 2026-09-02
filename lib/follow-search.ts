// Search runs client-side and interpolates user input into a PostgREST .or()
// filter string. Two unrelated classes of characters have to be stripped:
//   - `,` `.` `(` `)` are PostgREST filter-string STRUCTURE — `,` separates
//     .or() clauses, `.` separates column.operator.value, `(` `)` nest a
//     filter group. Left in, a query can inject an extra clause or split a
//     clause apart instead of just narrowing the match.
//   - `%` `*` `_` are LIKE/ILIKE WILDCARDS — `%` and its PostgREST alias `*`
//     match any run of characters, `_` matches any single character. Left
//     in, a query stops being a literal search term and starts matching rows
//     it has no business matching (e.g. a bare `*` matches every row).
// This is not SQL injection — PostgREST parameterizes underneath — but
// unescaped input can still alter which rows match, so strip both classes
// rather than trusting the query.
const STRUCTURAL = /[,.%()*_]/g

export function escapeFilterValue(q: string): string {
  return q.replace(STRUCTURAL, '')
}

// True when `q` has at least one character left after escaping (and
// trimming). Callers MUST check this before calling buildProfileSearchFilter:
// an empty escaped term reduces the filter to `username.ilike.%%`, which
// matches every row rather than none. buildProfileSearchFilter does not
// enforce this itself so its output stays a pure function of its input.
export function isSearchable(q: string): boolean {
  return escapeFilterValue(q.trim()).length > 0
}

// Case-insensitive substring match across both searchable profile fields.
// Callers must guard with isSearchable(q) first — see its doc comment.
export function buildProfileSearchFilter(q: string): string {
  const safe = escapeFilterValue(q)
  return `username.ilike.%${safe}%,display_name.ilike.%${safe}%`
}
