/**
 * Year-over-Year percentage change
 */
export function calcYoY(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Month-over-Month percentage change
 */
export function calcMoM(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Week-over-Week percentage change
 */
export function calcWoW(currentWeekValue: number, prevWeekSameDay: number): number | null {
  if (prevWeekSameDay === 0) return null
  return ((currentWeekValue - prevWeekSameDay) / prevWeekSameDay) * 100
}

/**
 * Format a percentage value with sign prefix
 */
export function formatPercent(value: number | null): string {
  if (value === null) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Format monetary amount with currency symbol
 * Default currency is JPY (¥)
 */
export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  const symbols: Record<string, string> = {
    JPY: '¥',
    KRW: '₩',
    USD: '$',
  }

  const symbol = symbols[currency] ?? currency + ' '
  const formatted = absAmount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })

  return `${sign}${symbol}${formatted}`
}
