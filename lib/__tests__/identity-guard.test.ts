import { describe, expect, it } from 'vitest'
import { removableProviders } from '../identity-guard'

const email = { provider: 'email' }
const google = { provider: 'google' }
const discord = { provider: 'discord' }

describe('removableProviders', () => {
  it('never allows removing a lone identity', () => {
    expect(removableProviders([email], true)).toEqual(new Set())
    expect(removableProviders([google], false)).toEqual(new Set())
  })

  it('allows removing either of two OAuth identities', () => {
    expect(removableProviders([google, discord], false)).toEqual(new Set(['google', 'discord']))
  })

  // Both are removable: dropping email leaves Google, dropping Google leaves
  // a real password. Either way a usable method survives.
  it('allows removing either when email has a password and Google is linked', () => {
    expect(removableProviders([email, google], true)).toEqual(new Set(['email', 'google']))
  })

  // The lockout case. The email identity exists but has no password behind
  // it, so Google is the ONLY usable method and must not be removable.
  // The passwordless email identity is still removable — it is not a usable
  // sign-in method, so dropping it strands nobody.
  it('blocks removing the last OAuth identity when email has no password', () => {
    expect(removableProviders([email, google], false)).toEqual(new Set(['email']))
  })

  it('allows removing anything when two OAuth identities remain', () => {
    expect(removableProviders([email, google, discord], false)).toEqual(
      new Set(['email', 'google', 'discord'])
    )
  })

  // Guards against a two-step lockout: after removing the passwordless email
  // identity above, the guard must still refuse the sole remaining identity.
  it('still blocks the sole remaining identity after an earlier removal', () => {
    expect(removableProviders([google], false)).toEqual(new Set())
  })

  it('handles an empty identity list', () => {
    expect(removableProviders([], false)).toEqual(new Set())
  })
})
