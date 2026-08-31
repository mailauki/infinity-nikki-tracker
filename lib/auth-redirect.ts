// Validates a `next` redirect parameter. Only a same-site absolute path is
// allowed through; everything else falls back to the site root.
//
// The '//' check is the point of this function. A leading '//' makes the
// value protocol-relative ('//evil.com' resolves to 'https://evil.com'), so
// a bare startsWith('/') test would wave an off-site redirect straight
// through.
export function safeNext(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}
