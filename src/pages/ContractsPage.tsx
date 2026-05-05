import { useMemo, useState } from 'react'
import { Search, Plus, FileText, CheckCircle2, Clock, TrendingUp, Star, Download } from 'lucide-react'
import { exportToCsv } from '@/utils/csvExport'
import { cn } from '@/lib/utils'
import { mockContractChanges, contractChangeStats } from '@/mocks/contracts'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import { useAuth } from '@/contexts/AuthContext'
import { useFilters } from '@/contexts/FilterContext'
import type { ContractChangeType, ContractChangeStatus } from '@/types'
import { toast } from 'sonner'

const TYPE_LABELS: Record<ContractChangeType, string> = {
  'SG-Flip': 'SG-Flip',
  'Settlement-Change': 'Settlement',
  'CreditLimit-Change': 'CreditLimit',
  Renewal: 'Renewal',
}
const STATUS_LABELS: Record<ContractChangeStatus, string> = {
  Pending: '대기',
  InProgress: '진행중',
  Completed: '완료',
  Rejected: '거부',
}
const STATUS_COLORS: Record<ContractChangeStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  InProgress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Rejected: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export default function ContractsPage() {
  const { user } = useAuth()
  const { filters } = useFilters()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContractChangeType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<ContractChangeStatus | 'All'>('All')

  const canApprove = user?.role === 'director' || user?.role === 'regional_director' || user?.role === 'c_level' || user?.role === 'ceo'

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return mockContractChanges.filter((c) => {
      if (typeFilter !== 'All' && c.type !== typeFilter) return false
      if (statusFilter !== 'All' && c.status !== statusFilter) return false
      if (filters.selectedChannelId && c.channelId !== filters.selectedChannelId) return false
      if (filters.pic !== 'All' && c.ownerUserId !== filters.pic) return false
      if (q) {
        const ch = mockClients.find((m) => m.id === c.channelId)
        const matches =
          (ch?.name ?? '').toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          (c.notes ?? '').toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [query, typeFilter, statusFilter, filters.selectedChannelId, filters.pic])

  const stats = contractChangeStats()

  const onApprove = (id: string) => {
    if (!canApprove) {
      toast.error('이 단계는 Director 이상 편집 가능합니다')
      return
    }
    toast.success(`${id} 승인 처리 (Mock)`)
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          계약변경 / SG Flip
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          FR-009 · 25건 (Settlement 17 + SG Flip 8) · Citi Bank ⭐ 강조
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={FileText} label="총 건수" value={stats.total} hint={`Pending ${stats.pending} · Rejected ${stats.rejected}`} />
        <SummaryCard icon={CheckCircle2} label="완료" value={stats.completed} hint={`${(stats.completionRate * 100).toFixed(0)}%`} color="emerald" />
        <SummaryCard icon={Clock} label="진행중" value={stats.inProgress} hint="Manager 검토 단계" color="blue" />
        <SummaryCard icon={TrendingUp} label="완료율" value={`${(stats.completionRate * 100).toFixed(0)}%`} hint="목표 80%" color="amber" />
      </section>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="회사명 / 타입 / 메모 검색..."
            className="w-full pl-7 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="타입 필터"
        >
          <option value="All">전체 타입</option>
          {(Object.keys(TYPE_LABELS) as ContractChangeType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="상태 필터"
        >
          <option value="All">전체 상태</option>
          {(Object.keys(STATUS_LABELS) as ContractChangeStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => {
            exportToCsv('contracts', filtered, [
              { key: 'id', header: 'ID' },
              { key: (c) => mockClients.find((m) => m.id === c.channelId)?.name ?? c.channelId, header: 'Channel' },
              { key: 'type', header: 'Type' },
              { key: 'oldValue', header: 'OldValue' },
              { key: 'newValue', header: 'NewValue' },
              { key: 'contractDate', header: 'ContractDate' },
              { key: 'followUpDate', header: 'FollowUp' },
              { key: 'completedDate', header: 'Completed' },
              { key: 'citiBankRef', header: 'CitiBank' },
              { key: 'status', header: 'Status' },
              { key: (c) => mockUsers.find((u) => u.id === c.ownerUserId)?.name ?? c.ownerUserId, header: 'Owner' },
              { key: 'notes', header: 'Notes' },
              { key: 'rejectionReason', header: 'RejectionReason' },
            ])
            toast.success(`${filtered.length}건 CSV 내보내기 완료`)
          }}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
          title="CSV로 내보내기"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <button
          onClick={() => toast.info('계약 추가 모달 (Phase 2)')}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 계약 추가
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Channel</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Old → New</th>
                <th className="text-left px-3 py-2 font-medium">Contract Date</th>
                <th className="text-left px-3 py-2 font-medium">Follow Up</th>
                <th className="text-left px-3 py-2 font-medium">Citi Bank</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Owner</th>
                <th className="text-right px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-xs text-muted-foreground">
                    매칭되는 계약 변경 없음
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const ch = mockClients.find((m) => m.id === c.channelId)
                  const owner = mockUsers.find((u) => u.id === c.ownerUserId)
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        'border-t border-border hover:bg-accent/40 transition-colors',
                        c.citiBankRef && 'bg-amber-50/30 dark:bg-amber-950/10'
                      )}
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{ch?.name ?? c.channelId}</td>
                      <td className="px-3 py-2 text-xs">{TYPE_LABELS[c.type]}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {c.oldValue && c.newValue ? `${c.oldValue} → ${c.newValue}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">{c.contractDate}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{c.followUpDate ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">
                        {c.citiBankRef ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {c.citiBankRef}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-medium', STATUS_COLORS[c.status])}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{owner?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-right">
                        {c.status === 'InProgress' ? (
                          <button
                            onClick={() => onApprove(c.id)}
                            disabled={!canApprove}
                            className={cn(
                              'h-7 px-2 text-[11px] rounded border',
                              canApprove
                                ? 'border-primary text-primary hover:bg-primary/10'
                                : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                            )}
                          >
                            승인
                          </button>
                        ) : (
                          <button
                            onClick={() => toast.info(`${c.id} 상세 (Phase 2)`)}
                            className="h-7 px-2 text-[11px] rounded border border-border text-muted-foreground hover:bg-accent"
                          >
                            상세
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        ⭐ 표시 = Citi Bank 환전/한도 변경 — 별도 Compliance 검토 필요
      </p>
    </div>
  )
}

function SummaryCard({
  icon: Icon, label, value, hint, color = 'gray',
}: {
  icon: typeof FileText
  label: string
  value: string | number
  hint?: string
  color?: 'gray' | 'emerald' | 'blue' | 'amber'
}) {
  const colorMap = {
    gray: 'text-muted-foreground',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn('w-4 h-4', colorMap[color])} />
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', colorMap[color])}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}
