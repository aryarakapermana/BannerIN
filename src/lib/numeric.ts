/**
 * Normalizes numeric string input so clearing a field leaves it empty ('')
 * instead of reverting to '0', and strips accidental leading zeros when followed
 * by non-zero digits (e.g. '0250' -> 250) while preserving a deliberate single 0.
 */
export function normalizeNumericText(raw: string): number | '' {
  const digitsOnly = raw.replace(/\D/g, '')
  if (digitsOnly === '') return ''
  const stripped = digitsOnly.replace(/^0+(?=\d)/, '')
  const parsed = Number(stripped)
  return Number.isFinite(parsed) ? parsed : ''
}

