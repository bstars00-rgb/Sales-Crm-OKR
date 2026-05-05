import { useState } from 'react'
import { X, Settings, Lock, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { mockKPITargets } from '@/mocks/kpi'
import { formatCurrency } from '@/utils/kpiCalc'
import type { KPITarget } from '@/types'

interface KPISettingsModalProps {
  open: boolean
  onClose: () => void
}

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'] as const
const QUARTER_KEYS = ['q1', 'q2', 'q3', 'q4'] as const

// Quarter end dates for 2026
const QUARTER_END_DATES: Record<string, Date> = {
  q1: new Date('2026-03-31T23:59:59'),
  q2: new Date('2026-06-30T23:59:59'),
  q3: new Date('2026-09-30T23:59:59'),
  q4: new Date('2026-12-31T23:59:59'),
}

const MOCK_CHANGE_HISTORY = [
  { date: '2026-01-15', user: '이지현 (디렉터)', field: 'Annual TTV Target', from: '¥220,000,000,000', to: '¥240,000,000,000' },
  { date: '2026-02-10', user: '박서준 (임원)', field: 'Q2 Target', from: '¥55,000,000,000', to: '¥58,000,000,000' },
  { date: '2025-12-20', user: '이지현 (디렉터)', field: 'Annual Room Nights', from: '2,100,000', to: '2,300,000' },
]

function isQuarterLocked(quarterKey: string): boolean {
  const now = new Date('2026-03-28T12:00:00Z')
  const endDate = QUARTER_END_DATES[quarterKey]
  return now > endDate
}

export default function KPISettingsModal({ open, onClose }: KPISettingsModalProps) {
  const { canEditKPITarget } = useAuth()

  const [targets, setTargets] = useState<KPITarget>({ ...mockKPITargets })

  if (!open) return null

  const canEdit = canEditKPITarget

  function handleAnnualChange(field: 'annualTTV' | 'annualRevenue' | 'annualRoomNights', value: string) {
    const num = Number(value.replace(/,/g, ''))
    if (isNaN(num)) return
    setTargets(prev => ({ ...prev, [field]: num }))
  }

  function handleQuarterTargetChange(qKey: string, value: string) {
    const num = Number(value.replace(/,/g, ''))
    if (isNaN(num)) return
    setTargets(prev => ({
      ...prev,
      quarters: {
        ...prev.quarters,
        [qKey]: { ...prev.quarters[qKey as keyof typeof prev.quarters], target: num },
      },
    }))
  }

  function handleSave() {
    toast.success('KPI 목표가 저장되었습니다')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">KPI Target Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Role notice */}
          {!canEdit && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <Lock className="w-4 h-4 shrink-0" />
              디렉터 이상 권한 필요 — 현재 읽기 전용 모드입니다
            </div>
          )}

          {/* Annual Targets */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">연간 목표 (Annual Targets)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">TTV 목표</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={targets.annualTTV.toLocaleString()}
                    onChange={e => handleAnnualChange('annualTTV', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="relative group">
                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed">
                      {formatCurrency(targets.annualTTV)}
                    </p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      디렉터 이상 권한 필요
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Revenue 목표</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={targets.annualRevenue.toLocaleString()}
                    onChange={e => handleAnnualChange('annualRevenue', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="relative group">
                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed">
                      {formatCurrency(targets.annualRevenue)}
                    </p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      디렉터 이상 권한 필요
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Room Nights 목표</label>
                {canEdit ? (
                  <input
                    type="text"
                    value={targets.annualRoomNights.toLocaleString()}
                    onChange={e => handleAnnualChange('annualRoomNights', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="relative group">
                    <p className="mt-1 px-3 py-2 text-sm rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed">
                      {targets.annualRoomNights.toLocaleString()}
                    </p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      디렉터 이상 권한 필요
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quarterly Targets */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">분기별 목표 (Quarterly Targets — TTV)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">분기</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">목표</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">현재</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground w-40">진행률</th>
                  </tr>
                </thead>
                <tbody>
                  {QUARTER_KEYS.map((qKey, i) => {
                    const q = targets.quarters[qKey]
                    const locked = isQuarterLocked(qKey)
                    const progress = q.target > 0 ? Math.min(100, (q.current / q.target) * 100) : 0
                    const isFieldDisabled = !canEdit || locked

                    return (
                      <tr key={qKey} className="border-b border-border last:border-0">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{QUARTER_LABELS[i]}</span>
                            {locked && (
                              <div className="relative group">
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  완료된 분기는 수정할 수 없습니다
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isFieldDisabled ? (
                            <div className="relative group inline-block">
                              <span className="text-muted-foreground">{formatCurrency(q.target)}</span>
                              {locked && (
                                <div className="absolute bottom-full right-0 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  완료된 분기는 수정할 수 없습니다
                                </div>
                              )}
                              {!canEdit && !locked && (
                                <div className="absolute bottom-full right-0 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  디렉터 이상 권한 필요
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={q.target.toLocaleString()}
                              onChange={e => handleQuarterTargetChange(qKey, e.target.value)}
                              className="w-36 px-2 py-1 text-sm text-right rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          {formatCurrency(q.current)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  progress >= 100 ? 'bg-emerald-500' :
                                  progress >= 80 ? 'bg-primary' :
                                  progress >= 50 ? 'bg-amber-500' :
                                  'bg-red-400'
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-xs font-medium w-12 text-right',
                              progress >= 100 ? 'text-emerald-600' : ''
                            )}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Change History */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              변경 이력
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">일자</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">변경자</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">항목</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">이전</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">변경</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CHANGE_HISTORY.map((entry, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-3 text-muted-foreground">{entry.date}</td>
                      <td className="py-2.5 px-3">{entry.user}</td>
                      <td className="py-2.5 px-3 font-medium">{entry.field}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{entry.from}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{entry.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!canEdit}
            className={cn(
              'px-4 py-2 text-sm rounded-md transition-colors',
              canEdit
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
