import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockClients } from '@/mocks/clients'
import { formatCurrency } from '@/utils/kpiCalc'
import ClientDetailModal from '@/components/crm/ClientDetailModal'
import type { Client, ContractStatus } from '@/types'

// Tier 1~3 (정식) + 0/4 (legacy 호환)
const TIER_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  1: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  2: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  3: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  4: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
}

const STATUS_COLORS: Record<ContractStatus, string> = {
  Active: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Expired: 'bg-orange-500',
  Suspended: 'bg-red-500',
  Inactive: 'bg-gray-400',
}

type SortKey = 'ttv' | 'tier' | 'alpha'

const PER_PAGE = 20

export default function CRMPage() {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('ttv')
  const [page, setPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    let list = [...mockClients]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.country ?? '').toLowerCase().includes(q)
      )
    }
    if (regionFilter) list = list.filter((c) => c.region === regionFilter)
    if (tierFilter) list = list.filter((c) => (c.autoTier ?? c.tier) === Number(tierFilter))
    if (statusFilter) list = list.filter((c) => (c.status ?? c.contractStatus) === statusFilter)

    list.sort((a, b) => {
      if (sort === 'ttv') return (b.ytdTTV ?? 0) - (a.ytdTTV ?? 0)
      if (sort === 'tier') return (b.autoTier ?? 0) - (a.autoTier ?? 0)
      return a.name.localeCompare(b.name)
    })

    return list
  }, [search, regionFilter, tierFilter, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="클라이언트 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">전체 지역</option>
          <option value="East Asia">동아시아</option>
          <option value="SE Asia">동남아시아</option>
          <option value="South Asia">남아시아</option>
          <option value="Middle East">중동</option>
          <option value="Oceania">오세아니아</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">전체 Tier</option>
          <option value="4">Tier 4</option>
          <option value="3">Tier 3</option>
          <option value="2">Tier 2</option>
          <option value="1">Tier 1</option>
          <option value="0">Tier 0</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">전체 상태</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ttv">매출순</option>
          <option value="tier">Tier순</option>
          <option value="alpha">알파벳순</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        총 {filtered.length}개 클라이언트
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className={cn(
              'bg-card border border-border rounded-lg p-4 text-left',
              'hover:shadow-md hover:border-primary/30 transition-all cursor-pointer'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[(client.status ?? client.contractStatus ?? 'Active') as ContractStatus])} />
                <h3 className="text-sm font-semibold truncate">{client.name}</h3>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-full shrink-0',
                  TIER_COLORS[(client.autoTier ?? client.tier ?? 1) as number]
                )}
              >
                T{client.autoTier ?? client.tier ?? 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">YTD TTV</p>
                <p className="text-sm font-semibold">{formatCurrency(client.ytdTTV ?? client.ttvJPY ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">점유율</p>
                <p className="text-sm font-semibold">{client.sharePercent ?? 0}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">예약</p>
                <p className="text-sm">{(client.ytdBookings ?? client.bookings ?? 0).toLocaleString()} 건</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Room Nights</p>
                <p className="text-sm">{(client.ytdRoomNights ?? client.rn ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {client.region} &middot; {client.country}
              </span>
              {(client.creditUsagePercent ?? 0) >= 70 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  신용 {client.creditUsagePercent ?? 0}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <ClientDetailModal
        client={selectedClient}
        open={selectedClient !== null}
        onClose={() => setSelectedClient(null)}
      />
    </div>
  )
}
