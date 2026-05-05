import { useState, useMemo } from 'react'
import {
  X, Sparkles, Building2, Mail, AlertTriangle, Activity as ActivityIcon, FileSignature,
  Plus, Pencil, Trash2, CheckCircle2, Clock, Eye,
  User as UserIcon, Phone, AtSign, ChevronRight, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { mockAlerts } from '@/mocks/alerts'
import { mockTasks } from '@/mocks/tasks'
import { formatCurrency } from '@/utils/kpiCalc'
import ActivityTimeline from './ActivityTimeline'
import type { Client, Contact, TierLevel, Alert, AlertStatus } from '@/types'

// ===== Constants =====
// FR-007 6탭: 요약 / 채널정보 / Activity / Tasks / 계약변경 / 알림
const TABS = ['요약', '채널 정보', 'Activity', 'Tasks', '계약변경', '알림'] as const
type TabKey = typeof TABS[number]

// Tier 1~3 + legacy 0/4 fallback
const TIER_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  1: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  2: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  3: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  4: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
}

const TIER_LABELS: Record<number, string> = {
  0: '전략 (legacy)',
  1: '전략',
  2: '성장',
  3: '신규',
  4: '소규모 (legacy)',
}

const TIER_PLANS: Record<number, string[]> = {
  0: ['주간 미팅 필수', 'VIP 대우 및 전담 지원', '전략적 파트너십 관리', '맞춤 보고서 제공'],
  1: ['주간 미팅 필수', 'VIP 대우 및 전담 지원', '전략적 파트너십 관리', '맞춤 보고서 제공'],
  2: ['월간 미팅 진행', '업셀링 기회 발굴', '성장 로드맵 수립', '정기 리뷰 미팅'],
  3: ['분기 미팅 진행', '기본 지원 제공', '표준 프로모션 적용', '온보딩 가속'],
  4: ['반기 리뷰', '셀프서비스 가이드', '자동화 리포트', '온라인 지원'],
}

const STATUS_DOT: Record<string, string> = {
  Active: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Suspended: 'bg-red-500',
  Inactive: 'bg-gray-400',
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  credit_usage: '신용 한도',
  credit_overdue: '미수금 연체',
  booking_surge: '예약 급증',
  booking_drop: '예약 감소',
  cancel_rate: '취소율',
  capacity_risk: '재고 위험',
}

const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  created: '생성',
  read: '읽음',
  resolved: '해결',
}

// ===== Mock emails =====
const MOCK_EMAILS = [
  { id: 'e1', date: '2026-03-27', subject: 'Q1 실적 리뷰 미팅 요청', from: 'manager@oh.com', to: '', direction: 'sent' as const, snippet: '안녕하세요, Q1 실적 관련 리뷰 미팅을 요청드립니다.' },
  { id: 'e2', date: '2026-03-25', subject: 'Re: 4월 프로모션 제안', from: '', to: 'manager@oh.com', direction: 'received' as const, snippet: '제안해 주신 프로모션 조건 검토 후 회신드리겠습니다.' },
  { id: 'e3', date: '2026-03-22', subject: '신규 호텔 상품 안내', from: 'manager@oh.com', to: '', direction: 'sent' as const, snippet: '새로 계약한 프리미엄 호텔 상품을 안내드립니다.' },
  { id: 'e4', date: '2026-03-18', subject: 'Re: 결제 조건 변경 요청', from: '', to: 'manager@oh.com', direction: 'received' as const, snippet: '결제 조건 변경에 대해 내부 검토 중입니다.' },
  { id: 'e5', date: '2026-03-15', subject: '3월 예약 현황 리포트', from: 'manager@oh.com', to: '', direction: 'sent' as const, snippet: '3월 중간 예약 현황을 공유드립니다.' },
  { id: 'e6', date: '2026-03-10', subject: 'Re: VIP 고객 특별 요금 협의', from: '', to: 'manager@oh.com', direction: 'received' as const, snippet: 'VIP 특별 요금에 대해 긍정적으로 검토하고 있습니다.' },
]

// ===== Props =====
interface ClientDetailModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
}

// ===== Component =====
export default function ClientDetailModal({ client, open, onClose }: ClientDetailModalProps) {
  const { user, canEditTier } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('요약')
  const [targetTier, setTargetTier] = useState<TierLevel | null>(null)

  // Contact editing
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)

  // Alert resolution
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null)
  const [resolutionMemo, setResolutionMemo] = useState('')
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([])

  // Initialize states when client changes
  const prevClientId = useState<string | null>(null)
  if (client && client.id !== prevClientId[0]) {
    prevClientId[1](client.id)
    setTargetTier((client.targetTier ?? null) as TierLevel | null)
    setContacts([...client.contacts])
    setLocalAlerts(mockAlerts.filter(a => a.clientId === client.id))
    setActiveTab('요약')
    setShowContactForm(false)
    setEditingContact(null)
    setResolvingAlertId(null)
  }

  if (!open || !client) return null

  const isOwnClient = user?.assignedClients?.includes(client.id) || user?.role === 'director' || user?.role === 'c_level' || user?.role === 'ceo'
  const canEditTarget = canEditTier && isOwnClient

  // ===== Derived Data =====
  const lastYearRev = client.lastYearRevenue ?? 0
  const ytdRev = client.ytdRevenue ?? 0
  const yoyGrowth = lastYearRev > 0
    ? ((ytdRev - lastYearRev) / lastYearRev * 100)
    : null

  const activeAlerts = localAlerts.filter(a => a.status !== 'resolved')
  const resolvedAlerts = localAlerts.filter(a => a.status === 'resolved')

  // ===== Handlers =====
  function handleResolveAlert(alert: Alert) {
    if (alert.type === 'booking_surge' && !resolutionMemo.trim()) {
      setResolvingAlertId(alert.id)
      return
    }
    setLocalAlerts(prev => prev.map(a =>
      a.id === alert.id
        ? { ...a, status: 'resolved' as AlertStatus, resolvedAt: new Date().toISOString(), resolutionMemo: resolutionMemo || undefined }
        : a
    ))
    setResolvingAlertId(null)
    setResolutionMemo('')
    toast.success('알림이 해결되었습니다')
  }

  function handleMarkRead(alert: Alert) {
    setLocalAlerts(prev => prev.map(a =>
      a.id === alert.id
        ? { ...a, status: 'read' as AlertStatus, readAt: new Date().toISOString() }
        : a
    ))
  }

  function handleDeleteContact(contact: Contact) {
    if (contact.role === 'Primary') {
      toast.error('Primary 담당자는 필수입니다')
      return
    }
    setContacts(prev => prev.filter(c => c.id !== contact.id))
    toast.success('담당자가 삭제되었습니다')
  }

  function handleSaveContact(contact: Contact) {
    // Email RFC validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact.email)) {
      toast.error('올바른 이메일 형식을 입력해주세요')
      return
    }
    if (!contact.name.trim()) {
      toast.error('이름을 입력해주세요')
      return
    }

    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === contact.id ? contact : c))
      toast.success('담당자 정보가 수정되었습니다')
    } else {
      setContacts(prev => [...prev, { ...contact, id: `ct_new_${Date.now()}` }])
      toast.success('담당자가 추가되었습니다')
    }
    setShowContactForm(false)
    setEditingContact(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_DOT[(client.status ?? client.contractStatus ?? 'Active')])} />
            <h2 className="text-lg font-semibold">{client.name}</h2>
            <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', TIER_COLORS[(client.autoTier ?? client.tier ?? 1)])}>
              Tier {client.autoTier ?? client.tier ?? 1}
            </span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
              {client.status ?? client.contractStatus ?? 'Active'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors relative',
                activeTab === tab
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
              {tab === '알림' && activeAlerts.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full">
                  {activeAlerts.length}
                </span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* ===== Content ===== */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === '요약' && (
            <TabAISummary
              client={client}
              yoyGrowth={yoyGrowth}
              targetTier={targetTier}
              canEditTarget={canEditTarget}
              onTargetTierChange={setTargetTier}
            />
          )}
          {activeTab === '채널 정보' && (
            <TabClientInfo
              client={client}
              contacts={contacts}
              onDeleteContact={handleDeleteContact}
              onEditContact={(c) => { setEditingContact(c); setShowContactForm(true) }}
              onAddContact={() => { setEditingContact(null); setShowContactForm(true) }}
              showContactForm={showContactForm}
              editingContact={editingContact}
              onSaveContact={handleSaveContact}
              onCancelContact={() => { setShowContactForm(false); setEditingContact(null) }}
            />
          )}
          {activeTab === 'Activity' && (
            <ActivityTimeline channelId={client.id} />
          )}
          {activeTab === 'Tasks' && (
            <TabTasks channelId={client.id} />
          )}
          {activeTab === '계약변경' && (
            <TabContractChanges client={client} />
          )}
          {activeTab === '알림' && (
            <TabAlerts
              activeAlerts={activeAlerts}
              resolvedAlerts={resolvedAlerts}
              resolvingAlertId={resolvingAlertId}
              resolutionMemo={resolutionMemo}
              onResolutionMemoChange={setResolutionMemo}
              onResolveAlert={handleResolveAlert}
              onMarkRead={handleMarkRead}
              onCancelResolve={() => { setResolvingAlertId(null); setResolutionMemo('') }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Tab 1: 요약 =====
function TabAISummary({
  client, yoyGrowth, targetTier, canEditTarget, onTargetTierChange,
}: {
  client: Client
  yoyGrowth: number | null
  targetTier: TierLevel | null
  canEditTarget: boolean
  onTargetTierChange: (t: TierLevel) => void
}) {
  // Legacy + 신규 필드 호환 — 한 곳에서 정규화
  const effectiveTier: TierLevel = (client.autoTier ?? client.tier ?? 1) as TierLevel
  const ytdTTV = client.ytdTTV ?? client.ttvJPY ?? 0
  const ytdRevenue = client.ytdRevenue ?? client.revenueJPY ?? 0
  const ytdRoomNights = client.ytdRoomNights ?? client.rn ?? 0
  const rank = client.rank ?? 0
  const sharePercent = client.sharePercent ?? 0

  return (
    <div className="space-y-5">
      {/* 고객 요약 카드 */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-primary">고객 요약</h3>
        </div>
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">{client.name}</span>은(는){' '}
          <span className="font-semibold">Tier {effectiveTier} ({TIER_LABELS[effectiveTier]})</span> 고객으로{' '}
          YTD TTV <span className="font-semibold">{formatCurrency(ytdTTV)}</span>을 달성했습니다.
          {yoyGrowth !== null && (
            <> 전년 대비{' '}
              <span className={cn('font-semibold', yoyGrowth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
              </span>{' '}
              {yoyGrowth >= 0 ? '성장' : '감소'}하였습니다.
            </>
          )}
          {' '}{client.region} 지역 <span className="font-semibold">#{rank}위</span> (점유율 {sharePercent}%)를 차지하고 있습니다.
        </p>
      </div>

      {/* Tier Action Plan */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Tier {effectiveTier} 액션 플랜 — {TIER_LABELS[effectiveTier]}</h3>
        <ul className="space-y-2">
          {(TIER_PLANS[effectiveTier] ?? []).map((plan: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{plan}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* YTD Performance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">YTD 실적</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">TTV</p>
            <p className="text-base font-bold">{formatCurrency(ytdTTV)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-base font-bold">{formatCurrency(ytdRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Room Nights</p>
            <p className="text-base font-bold">{ytdRoomNights.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">순위</p>
            <p className="text-base font-bold">#{rank}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">점유율</p>
            <p className="text-base font-bold">{sharePercent}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">YoY 성장률</p>
            <p className={cn('text-base font-bold', yoyGrowth && yoyGrowth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {yoyGrowth !== null ? `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Display */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Tier 관리</h3>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Auto Tier (자동)</p>
            <span className={cn('px-3 py-1 text-sm font-semibold rounded-full', TIER_COLORS[effectiveTier])}>
              Tier {effectiveTier}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Target Tier (목표)</p>
            {canEditTarget ? (
              <select
                value={targetTier ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? null : Number(e.target.value) as TierLevel
                  if (val !== null) {
                    onTargetTierChange(val)
                    toast.success(`목표 Tier가 Tier ${val}로 설정되었습니다`)
                  }
                }}
                className="px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">미설정</option>
                {([0, 1, 2, 3, 4] as TierLevel[]).map(t => (
                  <option key={t} value={t}>Tier {t} — {TIER_LABELS[t]}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-muted-foreground">
                {targetTier !== null ? `Tier ${targetTier}` : '미설정'}
              </span>
            )}
          </div>
        </div>
        {targetTier !== null && (
          <p className="mt-3 text-sm text-muted-foreground">
            현재: <span className="font-semibold">Tier {client.autoTier}</span> (목표: <span className="font-semibold text-primary">Tier {targetTier}</span>)
          </p>
        )}
      </div>
    </div>
  )
}

// ===== Tab 2: Client Info =====
function TabClientInfo({
  client, contacts, onDeleteContact, onEditContact, onAddContact,
  showContactForm, editingContact, onSaveContact, onCancelContact,
}: {
  client: Client
  contacts: Contact[]
  onDeleteContact: (c: Contact) => void
  onEditContact: (c: Contact) => void
  onAddContact: () => void
  showContactForm: boolean
  editingContact: Contact | null
  onSaveContact: (c: Contact) => void
  onCancelContact: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">기본 정보</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Client ID</p>
            <p className="font-medium font-mono">{client.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">이름</p>
            <p className="font-medium">{client.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">상태</p>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[(client.status ?? client.contractStatus ?? 'Active')])} />
              <span className="font-medium">{client.status ?? client.contractStatus ?? 'Active'}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">지역</p>
            <p className="font-medium">{client.region}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">국가</p>
            <p className="font-medium">{client.country}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">담당 매니저</p>
            <p className="font-medium">{client.assignedManager}</p>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">계약 정보</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Contract Entity</p>
            <p className="font-medium">{client.contractEntity || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Markup %</p>
            <p className="font-medium">{client.markupPercent != null ? `${client.markupPercent}%` : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Supply Currency</p>
            <p className="font-medium">{client.supplyCurrency || '-'}</p>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">결제 정보</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Payment Terms</p>
            <p className="font-medium">{client.paymentTerms || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deposit Type</p>
            <p className="font-medium">{client.depositType || '-'}</p>
          </div>
          {client.depositAmount != null && (
            <div>
              <p className="text-xs text-muted-foreground">Deposit Amount</p>
              <p className="font-medium">{formatCurrency(client.depositAmount)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">신용 한도</p>
            <p className="font-medium">{formatCurrency(client.creditLimit ?? client.creditLimitJPY ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">신용 사용률</p>
            <p className={cn('font-medium', (client.creditUsagePercent ?? 0) >= 80 ? 'text-red-500' : (client.creditUsagePercent ?? 0) >= 60 ? 'text-amber-600' : '')}>
              {client.creditUsagePercent ?? 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">담당자 목록</h3>
          <button
            onClick={onAddContact}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>

        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{contact.name}</p>
                  <span className={cn(
                    'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                    contact.role === 'Primary' ? 'bg-blue-100 text-blue-700' :
                    contact.role === 'Finance' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {contact.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{contact.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AtSign className="w-3 h-3" />{contact.email}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />{contact.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditContact(contact)}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  title="수정"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => onDeleteContact(contact)}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        {showContactForm && (
          <ContactForm
            contact={editingContact}
            onSave={onSaveContact}
            onCancel={onCancelContact}
          />
        )}
      </div>
    </div>
  )
}

// ===== Contact Form =====
function ContactForm({
  contact, onSave, onCancel,
}: {
  contact: Contact | null
  onSave: (c: Contact) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Contact>(
    contact ?? {
      id: '',
      name: '',
      title: '',
      role: 'Secondary',
      email: '',
      phone: '',
    }
  )

  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-background space-y-3">
      <h4 className="text-sm font-semibold">{contact ? '담당자 수정' : '담당자 추가'}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">이름 *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">직함</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">역할</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as Contact['role'] })}
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">이메일 *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="user@example.com"
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">전화번호</label>
          <input
            type="text"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="+81-3-1234-5678"
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
        >
          취소
        </button>
        <button
          onClick={() => onSave(form)}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  )
}

// ===== Tab 3: Email Log =====
function TabEmailLog({ client }: { client: Client }) {
  const emails = useMemo(() =>
    MOCK_EMAILS.map(e => ({
      ...e,
      from: e.direction === 'sent' ? 'manager@oh.com' : (client.contacts[0]?.email || 'contact@client.com'),
      to: e.direction === 'sent' ? (client.contacts[0]?.email || 'contact@client.com') : 'manager@oh.com',
    })),
    [client]
  )

  const sentCount = emails.filter(e => e.direction === 'sent').length
  const receivedCount = emails.filter(e => e.direction === 'received').length
  const avgResponseDays = 2.3

  return (
    <div className="space-y-5">
      {/* Email Analysis */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">이메일 분석</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">발신</p>
            <p className="text-lg font-bold">{sentCount}건</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">수신</p>
            <p className="text-lg font-bold">{receivedCount}건</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평균 응답</p>
            <p className="text-lg font-bold">{avgResponseDays}일</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          최근 30일 기준 커뮤니케이션 빈도가 양호합니다. 프로모션 및 결제 관련 논의가 활발합니다.
        </p>
      </div>

      {/* Email List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {emails.map(email => (
          <div key={email.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                  email.direction === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                )}>
                  {email.direction === 'sent' ? '발신' : '수신'}
                </span>
                <p className="text-sm font-medium">{email.subject}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{email.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Mail className="w-3 h-3" />
              <span>{email.from}</span>
              <span>&rarr;</span>
              <span>{email.to}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{email.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Tab 4: Alerts =====
function TabAlerts({
  activeAlerts, resolvedAlerts,
  resolvingAlertId, resolutionMemo,
  onResolutionMemoChange, onResolveAlert, onMarkRead, onCancelResolve,
}: {
  activeAlerts: Alert[]
  resolvedAlerts: Alert[]
  resolvingAlertId: string | null
  resolutionMemo: string
  onResolutionMemoChange: (v: string) => void
  onResolveAlert: (a: Alert) => void
  onMarkRead: (a: Alert) => void
  onCancelResolve: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          활성 알림 ({activeAlerts.length})
        </h3>
        {activeAlerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
            활성 알림이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-muted">
                      {ALERT_TYPE_LABELS[alert.type]}
                    </span>
                    <span className={cn('px-2 py-0.5 text-xs font-semibold rounded border', SEVERITY_BADGE[alert.severity])}>
                      {alert.severity}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {alert.status === 'created' ? <Clock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {ALERT_STATUS_LABELS[alert.status]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm mb-3">{alert.message}</p>

                {/* Resolution memo for booking_surge */}
                {resolvingAlertId === alert.id && (
                  <div className="mb-3 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">해결 메모 (필수)</label>
                    <textarea
                      value={resolutionMemo}
                      onChange={e => onResolutionMemoChange(e.target.value)}
                      placeholder="예약 급증에 대한 대응 조치를 기록해주세요..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {alert.status === 'created' && (
                    <button
                      onClick={() => onMarkRead(alert)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      읽음
                    </button>
                  )}
                  {resolvingAlertId === alert.id ? (
                    <>
                      <button
                        onClick={() => onResolveAlert(alert)}
                        disabled={!resolutionMemo.trim()}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        확인
                      </button>
                      <button
                        onClick={onCancelResolve}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-accent transition-colors"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onResolveAlert(alert)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      해결
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            해결된 알림 ({resolvedAlerts.length})
          </h3>
          <div className="space-y-3">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="border border-border rounded-lg p-4 opacity-70">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-muted">
                      {ALERT_TYPE_LABELS[alert.type]}
                    </span>
                    <span className={cn('px-2 py-0.5 text-xs font-semibold rounded border', SEVERITY_BADGE[alert.severity])}>
                      {alert.severity}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      해결
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString('ko-KR') : ''}
                  </span>
                </div>
                <p className="text-sm mb-1">{alert.message}</p>
                {alert.resolutionMemo && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                    <span className="font-medium">해결 메모:</span> {alert.resolutionMemo}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Tab 5: Tasks (Critical 6 by channel) =====
function TabTasks({ channelId }: { channelId: string }) {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  const tasks = mockTasks.filter(
    (t) => t.channelId === channelId && t.ownerUserId === user?.id
  )

  if (!tasks.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" />
        이 채널에 등록된 본인 Task가 없습니다.
        <div className="text-xs mt-2">Daily Briefing 페이지에서 Critical 6에 추가하세요.</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div
          key={t.id}
          className={cn(
            'p-3 rounded-lg border',
            t.status === 'Done'
              ? 'bg-muted/40 border-border/50'
              : 'bg-background border-border'
          )}
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{t.rank}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {t.category}
            </span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                t.status === 'Done'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              )}
            >
              {t.status}
            </span>
            {t.date === today && (
              <span className="text-[10px] text-muted-foreground">오늘</span>
            )}
          </div>
          <div
            className={cn(
              'text-sm font-medium',
              t.status === 'Done' && 'line-through text-muted-foreground'
            )}
          >
            {t.title}
          </div>
          {t.expectedOutcome && (
            <div className="text-xs text-muted-foreground mt-0.5">
              예상 결과: {t.expectedOutcome}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ===== Tab 6: 계약변경 / SG Flip (placeholder) =====
function TabContractChanges({ client }: { client: Client }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileSignature className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium">현재 계약 정보</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="계약 상태" value={client.contractStatus ?? client.status ?? '—'} />
          <Field label="결제 조건" value={client.settlement ?? client.paymentTerms ?? '—'} />
          <Field
            label="신용 한도"
            value={
              client.creditLimitJPY
                ? `¥${(client.creditLimitJPY / 1_000_000).toLocaleString()}M`
                : client.creditLimit
                ? `¥${(client.creditLimit / 1_000_000).toLocaleString()}M`
                : '—'
            }
          />
          <Field label="계약 시작" value={client.contractStartDate ?? '—'} />
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-30" />
        등록된 계약변경(SG Flip / Settlement / Credit Limit)이 없습니다.
        <div className="text-xs mt-2">
          Contracts 페이지에서 신규 계약변경을 등록할 수 있습니다.
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  )
}
