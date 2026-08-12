import { describe, expect, it } from 'vitest'
import { validateSubmission } from '@/lib/feedback/validate'

const valid = {
  type: 'issue',
  category: 'Bug report',
  title: 'Image fails to load',
  description: 'The thumbnail is blank on this set.',
}

describe('validateSubmission', () => {
  it('accepts a valid submission and trims whitespace', () => {
    const result = validateSubmission({ ...valid, title: '  Image fails to load  ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.title).toBe('Image fails to load')
      expect(result.value.type).toBe('issue')
      expect(result.value.email).toBeNull()
    }
  })

  it('rejects an unknown type', () => {
    const result = validateSubmission({ ...valid, type: 'spam' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.type).toBeDefined()
  })

  it('rejects a category that does not belong to the type', () => {
    // 'New feature' is a feature category, not an issue category.
    const result = validateSubmission({ ...valid, type: 'issue', category: 'New feature' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.category).toBeDefined()
  })

  it('accepts a category that does belong to the type', () => {
    const result = validateSubmission({
      ...valid,
      type: 'feature',
      category: 'New feature',
    })
    expect(result.ok).toBe(true)
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(validateSubmission({ ...valid, title: '' }).ok).toBe(false)
    expect(validateSubmission({ ...valid, title: '   ' }).ok).toBe(false)
  })

  it('rejects an empty description', () => {
    expect(validateSubmission({ ...valid, description: '' }).ok).toBe(false)
  })

  it('rejects an over-long title', () => {
    const result = validateSubmission({ ...valid, title: 'x'.repeat(201) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.title).toBeDefined()
  })

  it('rejects an over-long description', () => {
    const result = validateSubmission({ ...valid, description: 'x'.repeat(5001) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.description).toBeDefined()
  })

  it('accepts a valid email and normalizes case', () => {
    const result = validateSubmission({ ...valid, email: '  User@Example.COM ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.email).toBe('user@example.com')
  })

  it('rejects a malformed email', () => {
    const result = validateSubmission({ ...valid, email: 'not-an-email' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.email).toBeDefined()
  })

  it('treats an empty email string as absent', () => {
    const result = validateSubmission({ ...valid, email: '   ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.email).toBeNull()
  })

  it('reports every failing field at once', () => {
    const result = validateSubmission({
      type: 'issue',
      category: 'Bug report',
      title: '',
      description: '',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['description', 'title'])
    }
  })
})
