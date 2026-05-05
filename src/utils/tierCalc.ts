import type { TierLevel } from '@/types'

/**
 * Calculate tier based on last year's revenue (JPY)
 */
export function calculateTier(lastYearRevenue: number): TierLevel {
  if (lastYearRevenue >= 5_000_000_000) return 0
  if (lastYearRevenue >= 2_000_000_000) return 1
  if (lastYearRevenue >= 1_000_000_000) return 2
  if (lastYearRevenue >= 500_000_000) return 3
  return 4
}

/**
 * Korean label for each tier
 */
export function getTierLabel(tier: TierLevel): string {
  const labels: Record<TierLevel, string> = {
    0: 'VIP (50억+)',
    1: 'Platinum (20억+)',
    2: 'Gold (10억+)',
    3: 'Silver (5억+)',
    4: 'Standard',
  }
  return labels[tier]
}

/**
 * Tailwind color class for each tier
 */
export function getTierColor(tier: TierLevel): string {
  const colors: Record<TierLevel, string> = {
    0: 'text-amber-500 bg-amber-50 border-amber-200',
    1: 'text-violet-600 bg-violet-50 border-violet-200',
    2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    3: 'text-slate-500 bg-slate-50 border-slate-200',
    4: 'text-gray-400 bg-gray-50 border-gray-200',
  }
  return colors[tier]
}
