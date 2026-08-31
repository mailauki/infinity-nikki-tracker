// Validates a `next` redirect parameter. Only a same-site absolute path is
// allowed through; everything else falls back to the site root.
//
// Three attack vectors are mitigated. A leading '//' makes the value
// protocol-relative ('//evil.com' resolves to 'https://evil.com'). Browsers
// also treat backslashes as forward slashes in the authority section (WHATWG
// URL parsing), so '/\evil.com' is equally dangerous. Worse, the WHATWG URL
// parser strips tab, newline, and carriage return entirely before parsing, so
// '/\t/evil.com' becomes '//evil.com' after stripping — protocol-relative and
// off-site. All three bypass a naive startsWith('/') check. We strip control
// characters first, then normalize backslashes, then test the prefix. Return
// the ORIGINAL value on success (legitimate paths never contain these chars).
export function safeNext(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  const stripped = value.replace(/[\t\n\r]/g, '')
  const normalized = stripped.replace(/\\/g, '/')
  if (normalized.startsWith('//')) return '/'
  return value
}
