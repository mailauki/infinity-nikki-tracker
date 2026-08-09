// Admin route constants, deliberately kept in a module with NO 'use client'
// directive and no imports.
//
// This constant used to live in app/admin/form-context.tsx, which IS a client
// module. Importing it from a Server Action did not yield the string '/admin' —
// it yielded a client *reference*: a stub function whose body throws
// "Attempted to call ADMIN_DASHBOARD() from the server...". Passing that to
// redirect() stringified the stub's source into the x-action-redirect header,
// whose embedded newlines made Node throw
//   TypeError: Invalid character in header content ["x-action-redirect"]
// with the DB write already committed, so the row saved and only the response
// broke. That is why the redirect target always looked like clean ASCII when
// inspected by hand — the corruption was never in the path, it was in what the
// import resolved to.
//
// Anything a Server Action imports must come from a module the server can
// evaluate for real. Keep server-consumed constants here, not in a client module.
export const ADMIN_DASHBOARD = '/admin'

/**
 * Rebuild the dashboard URL from validated scalars.
 *
 * Deliberately NOT a `?returnTo=<url>` passthrough. The 2026-07-09
 * remove-admin-back-searchparams spec removed `?back=<url>` precisely so
 * redirect() would stop receiving a URL-decoded query value. This takes an
 * entity key, a gap kind and a page number, and always emits '/admin?…' —
 * an attacker-supplied value can change which queue you land on, nothing more.
 */
export function buildDashboardHref({
  entity,
  gap,
  page,
}: {
  entity?: string | null
  gap?: string | null
  page?: number | null
}): string {
  const params = new URLSearchParams()
  if (entity) params.set('entity', entity)
  if (gap) params.set('gap', gap)
  if (page && page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${ADMIN_DASHBOARD}?${qs}` : ADMIN_DASHBOARD
}
