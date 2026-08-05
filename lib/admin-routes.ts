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
