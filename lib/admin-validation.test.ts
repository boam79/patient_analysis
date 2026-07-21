import { describe, expect, it } from 'vitest'
import { sanitizeSearchTerm, validateAdminPassword } from './admin-validation'

describe('sanitizeSearchTerm', () => {
  it('strips like wildcards and filter metacharacters', () => {
    expect(sanitizeSearchTerm('a%b_c,d.(e)')).toBe('a b c d e')
  })

  it('trims and caps length', () => {
    expect(sanitizeSearchTerm(`  ${'x'.repeat(120)}  `).length).toBe(80)
  })

  it('returns empty for blank input', () => {
    expect(sanitizeSearchTerm('   ')).toBe('')
  })
})

describe('validateAdminPassword', () => {
  it('accepts strong passwords', () => {
    expect(validateAdminPassword('SecurePass1')).toBeNull()
  })

  it('rejects short or non-alphanumeric-mixed passwords', () => {
    expect(validateAdminPassword('short1')).toMatch(/10자/)
    expect(validateAdminPassword('abcdefghij')).toMatch(/영문과 숫자/)
    expect(validateAdminPassword('1234567890')).toMatch(/영문과 숫자/)
  })
})
