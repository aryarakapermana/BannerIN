'use client'

import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { normalizeNumericText } from '@/lib/numeric'

export interface NumericInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | ''
  onValueChange: (value: number | '') => void
}

/**
 * Controlled integer numeric input that prevents leading-zero carry-over
 * ('0250' -> 250) and allows the field to remain truly empty when cleared.
 */
export function NumericInput({
  value,
  onValueChange,
  inputMode = 'numeric',
  ...props
}: NumericInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange(normalizeNumericText(e.target.value))
  }

  return (
    <input
      {...props}
      type="text"
      inputMode={inputMode}
      suppressHydrationWarning
      value={value === '' ? '' : String(value)}
      onChange={handleChange}
    />
  )
}

