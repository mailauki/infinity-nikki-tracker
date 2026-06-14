// PostgREST caps a single response at 1000 rows, so any unbounded select on a
// table that can hold a large per-user collection (obtained_eureka,
// obtained_outfit) would silently drop every row past the first page — breaking
// toggles, filters, and progress counts. fetchAllRows pages through with
// .range() until a short page signals the end.
//
// `queryPage(from, to)` must run the same select/filter for the given inclusive
// row range; callers keep their own typed query so result types are preserved.
const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1)
    if (error) throw error

    const page = data ?? []
    all.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return all
}
