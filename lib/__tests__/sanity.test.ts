import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('test infrastructure', () => {
  it('runs tests and resolves the @/ alias', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
})
