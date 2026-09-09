export interface JwtDecoded {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return decodeURIComponent(
    Array.from(atob(padded))
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  )
}

export function decodeJwt(token: string): JwtDecoded {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error('A JWT must contain three dot-separated sections.')
  }

  const header = JSON.parse(decodeBase64Url(parts[0]))
  const payload = JSON.parse(decodeBase64Url(parts[1]))
  if (!header || typeof header !== 'object' || Array.isArray(header)) {
    throw new Error('JWT header must be a JSON object.')
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('JWT payload must be a JSON object.')
  }

  return { header, payload, signature: parts[2] }
}

export interface RegexMatch {
  value: string
  index: number
  end: number
}

export function findRegexMatches(pattern: string, flags: string, input: string): RegexMatch[] {
  if (!pattern) return []
  const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`)
  const matches: RegexMatch[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    matches.push({ value: match[0], index: match.index, end: match.index + match[0].length })
    if (match[0] === '') regex.lastIndex += 1
  }

  return matches
}

export type DiffLineType = 'same' | 'added' | 'removed'

export interface DiffLine {
  type: DiffLineType
  value: string
  lineNumber: number
}

export function diffLines(left: string, right: string): DiffLine[] {
  const leftLines = left ? left.split('\n') : []
  const rightLines = right ? right.split('\n') : []
  const rows = leftLines.length + 1
  const columns = rightLines.length + 1
  const lcs = Array.from({ length: rows }, () => Array<number>(columns).fill(0))

  for (let row = leftLines.length - 1; row >= 0; row -= 1) {
    for (let column = rightLines.length - 1; column >= 0; column -= 1) {
      lcs[row][column] =
        leftLines[row] === rightLines[column]
          ? lcs[row + 1][column + 1] + 1
          : Math.max(lcs[row + 1][column], lcs[row][column + 1])
    }
  }

  const result: DiffLine[] = []
  let row = 0
  let column = 0
  let lineNumber = 1

  while (row < leftLines.length || column < rightLines.length) {
    if (
      row < leftLines.length &&
      column < rightLines.length &&
      leftLines[row] === rightLines[column]
    ) {
      result.push({ type: 'same', value: leftLines[row], lineNumber })
      row += 1
      column += 1
    } else if (
      column < rightLines.length &&
      (row === leftLines.length || lcs[row][column + 1] >= lcs[row + 1][column])
    ) {
      result.push({ type: 'added', value: rightLines[column], lineNumber })
      column += 1
    } else {
      result.push({ type: 'removed', value: leftLines[row], lineNumber })
      row += 1
    }
    lineNumber += 1
  }

  return result
}
