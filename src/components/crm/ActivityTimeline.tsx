import { useMemo, useState } from 'react'
import {
  Mail, Phone, Users, FileText, FileSignature, AlertTriangle,
  Tag, MapPin, Search, Plus, Trash2, Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockUsers } from '@/mocks/users'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityStore } from '@/contexts/ActivityStore'
import { toast } from 'sonner'
import type { Activity, ActivityType } from '@/types'

const TYPE_META: Record<ActivityType, { label: string; icon: typeof Mail; color: string }> = {
  Email: { label: '이메일', icon: Mail, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  Call: { label: '콜', icon: Phone, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
  Meeting: { label: '미팅', icon: Users, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
  Note: { label: '노트', icon: FileText, color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10' },
  Contract: { label: '계약', icon: FileSignature, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  Issue: { label: '이슈', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400 bg-red-500/10' },
  Promotion: { label: '프로모션', icon: Tag, color: 'text-pink-600 dark:text-pink-400 bg-pink-500/10' },
  Visit: { label: '방문', icon: MapPin, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' },
}

const TYPE_ORDER: ActivityType[] = ['Email', 'Call', 'Meeting', 'Visit', 'Promotion', 'Contract', 'Issue', 'Note']

interface Props {
  channelId: string
  prefilledType?: ActivityType
}

export default function ActivityTimeline({ channelId, prefilledType }: Props) {
  const { user } = useAuth()
  const { getActivitiesByChannel, addActivity, deleteActivity, updateActivity } = useActivityStore()
  const activities = getActivitiesByChannel(channelId)

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all')
  const [showForm, setShowForm] = useState<ActivityType | null>(prefilledType ?? null)
  const [draft, setDraft] = useState<Partial<Activity>>({ subject: '', content: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Activity>>({})

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (filterType !== 'all' && a.type !== filterType) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          a.subject.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.note?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [activities, query, filterType])

  const handleAdd = () => {
    if (!showForm || !user) return
    if (!draft.subject?.trim()) return toast.error('제목을 입력하세요')
    addActivity({
      channelId,
      authorUserId: user.id,
      type: showForm,
      occurredAt: new Date().toISOString(),
      subject: draft.subject!,
      content: draft.content ?? '',
      action: draft.action,
      note: draft.note,
      source: 'manual',
    })
    setDraft({ subject: '', content: '' })
    setShowForm(null)
    toast.success(`${TYPE_META[showForm].label} 기록 완료`, {
      description: '주간 보고에 자동 반영됩니다',
    })
  }

  const handleDelete = (id: string) => {
    deleteActivity(id)
    toast('삭제됨')
  }

  const handleEditSave = () => {
    if (!editingId) return
    if (!editDraft.subject?.trim()) return toast.error('제목을 입력하세요')
    updateActivity(editingId, editDraft)
    setEditingId(null)
    setEditDraft({})
    toast.success('수정됨')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목 / 내용 / 노트 검색..."
            aria-label="Activity 검색"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ActivityType | 'all')}
          aria-label="유형 필터"
          className="px-3 py-2 text-sm bg-background border border-border rounded-md"
        >
          <option value="all">전체 유형</option>
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>
      </div>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-1.5">
        {(['Email', 'Call', 'Meeting', 'Note'] as ActivityType[]).map((t) => {
          const meta = TYPE_META[t]
          const Icon = meta.icon
          return (
            <button
              key={t}
              onClick={() => setShowForm(t)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <Plus className="w-3 h-3" />
              <Icon className={cn('w-3 h-3', meta.color.split(' ').filter(c => c.startsWith('text-')).join(' '))} />
              {meta.label} 기록
            </button>
          )
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            {(() => {
              const Icon = TYPE_META[showForm].icon
              return <Icon className="w-4 h-4" />
            })()}
            새 {TYPE_META[showForm].label} 기록
          </div>
          <input
            autoFocus
            value={draft.subject ?? ''}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="제목"
            aria-label="Activity 제목"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={draft.content ?? ''}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="상세 내용"
            aria-label="상세 내용"
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            value={draft.action ?? ''}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            placeholder="후속 액션 (선택)"
            aria-label="후속 액션"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              저장
            </button>
            <button
              onClick={() => { setShowForm(null); setDraft({ subject: '', content: '' }) }}
              className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm">{query || filterType !== 'all' ? '검색 결과 없음' : '활동 기록이 없습니다'}</p>
          <p className="text-xs">위 빠른 액션 버튼으로 첫 활동을 추가하세요</p>
        </div>
      ) : (
        <ol className="relative space-y-3">
          {filtered.map((a, idx) => {
            const meta = TYPE_META[a.type]
            const Icon = meta.icon
            const author = mockUsers.find((u) => u.id === a.authorUserId)
            const date = new Date(a.occurredAt)
            const dateStr = date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            const isLast = idx === filtered.length - 1
            const canEdit = user?.id === a.authorUserId

            return (
              <li key={a.id} className="group flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', meta.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isLast && <div className="flex-1 w-px bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-3 min-w-0">
                  {editingId === a.id ? (
                    <div className="space-y-2">
                      <input
                        value={editDraft.subject ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, subject: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                      />
                      <textarea
                        value={editDraft.content ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-border rounded bg-background resize-none"
                      />
                      <div className="flex gap-1">
                        <button onClick={handleEditSave} className="px-2 py-1 rounded text-xs bg-primary text-primary-foreground">저장</button>
                        <button onClick={() => { setEditingId(null); setEditDraft({}) }} className="px-2 py-1 rounded text-xs hover:bg-accent">취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{a.subject}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', meta.color)}>
                          {meta.label}
                        </span>
                        {a.source !== 'manual' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {a.source}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">· {author?.name ?? a.authorUserId}</span>
                        <span className="text-xs text-muted-foreground">· {dateStr}</span>
                        {a.durationMin && (
                          <span className="text-xs text-muted-foreground">· {a.durationMin}분</span>
                        )}
                        {canEdit && (
                          <span className="ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex gap-0.5">
                            <button
                              onClick={() => { setEditingId(a.id); setEditDraft({ subject: a.subject, content: a.content }) }}
                              aria-label="Activity 수정"
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              aria-label="Activity 삭제"
                              className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{a.content}</p>
                      {a.action && (
                        <div className="mt-1.5 text-xs">
                          <span className="text-muted-foreground">후속 액션: </span>
                          <span className="text-foreground">{a.action}</span>
                        </div>
                      )}
                      {a.note && (
                        <div className="mt-1 text-xs text-muted-foreground italic">📝 {a.note}</div>
                      )}
                      {a.relatedTaskId && (
                        <div className="mt-1 text-[10px] text-primary/70">↳ Task #{a.relatedTaskId} (자동 생성)</div>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
