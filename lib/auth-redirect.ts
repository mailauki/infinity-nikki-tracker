// Validates a `next` redirect parameter. Only a same-site absolute path is
// allowed through; everything else falls back to the site root.
//
// The '//' and '/\' checks are critical. A leading '//' makes the value
// protocol-relative ('//evil.com' resolves to 'https://evil.com'). Browsers
// also treat backslashes as forward slashes in the authority section (WHATWG
// URL parsing), so '/\evil.com' is equally dangerous. A bare startsWith('/')
// test would wave both straight through, so we normalize backslashes before
// the safety check and return the ORIGINAL value on success.
export function safeNext(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  const normalized = value.replace(/\\/g, '/')
  if (normalized.startsWith('//')) return '/'
  return value
}
