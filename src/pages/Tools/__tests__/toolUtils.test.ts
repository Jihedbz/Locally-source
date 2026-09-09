import { describe, expect, it } from 'vitest'
import { decodeJwt, diffLines, findRegexMatches } from '../toolUtils'

describe('tool utilities', () => {
  it('decodes JWT header and payload', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoidXNlciJ9.signature'

    expect(decodeJwt(token)).toEqual({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '123', role: 'user' },
      signature: 'signature',
    })
  })

  it('rejects malformed JWTs', () => {
    expect(() => decodeJwt('not-a-token')).toThrow('three dot-separated')
  })

  it('finds regex matches and adds global matching when needed', () => {
    expect(findRegexMatches('app', 'i', 'App app tool')).toEqual([
      { value: 'App', index: 0, end: 3 },
      { value: 'app', index: 4, end: 7 },
    ])
  })

  it('produces added and removed diff lines', () => {
    expect(diffLines('one\ntwo', 'one\nthree')).toEqual([
      { type: 'same', value: 'one', lineNumber: 1 },
      { type: 'added', value: 'three', lineNumber: 2 },
      { type: 'removed', value: 'two', lineNumber: 3 },
    ])
  })
})
