export type IdentitySummary = { provider: string }

// An 'email' identity is only a usable sign-in method when a password is
// actually set. Supabase can attach an email identity to an account that has
// never had one (automatic linking on an OAuth sign-in), so presence alone
// proves nothing.
function isUsable(identity: IdentitySummary, hasPassword: boolean): boolean {
  return identity.provider === 'email' ? hasPassword : true
}

// Returns the providers that can be disconnected without locking the user
// out — i.e. those whose removal leaves at least one usable method behind.
//
// Supabase's API only requires that 2+ identities remain, which is weaker:
// it would allow removing the sole OAuth identity from an account whose only
// other identity is a passwordless email one.
export function removableProviders(
  identities: IdentitySummary[],
  hasPassword: boolean
): Set<string> {
  const usableCount = identities.filter((i) => isUsable(i, hasPassword)).length

  return new Set(
    identities
      .filter((identity) => {
        const remaining = usableCount - (isUsable(identity, hasPassword) ? 1 : 0)
        return remaining >= 1
      })
      .map((i) => i.provider)
  )
}
