// /okr/my — 본인 OKR Tree (FR-033 BR-033-10)
// Round 14 OKR Platform consumer — Annual → KR → Goal → Critical 6 task 4-level drill-down

import { useEffect, useState } from 'react'
import { useOkr } from '@/contexts/OkrContext'
import type { OkrTreeNode } from '@/types'
import { ChevronRight, ChevronDown, Target, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OkrTreePage() {
  const { client, isHealthy } = useOkr()
  const [tree, setTree] = useState<OkrTreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    setPageError(false)
    client
      .getCompanyOkrTree(2026)
      .then((t) => {
        setTree(t)
        // 디폴트로 모든 Objective 펼침
        const ids = new Set<string>([t.id])
        t.children?.forEach((c) => ids.add(c.id))
        setExpanded(ids)
      })
      .catch(() => {
        setTree(null)
        setPageError(true)
      })
      .finally(() => setLoading(false))
  }, [client])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!isHealthy || pageError) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
          <strong>OKR 시스템 일시 미연결</strong> — 작성한 내용은 곧 동기화됩니다 (5xx graceful degrade)
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-6 text-muted-foreground">로딩 중...</div>
  if (!tree) return <div className="p-6 text-muted-foreground">OKR 데이터 없음</div>

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> OKR Tree — 2026 / Q3
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Annual Objective → Quarterly KR → 매핑된 Critical 6 task drill-down. CEO + Director가 정의한 회사
          큰 그림을 본인 일일 업무와 연결합니다.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <TreeNodeRow node={tree} level={0} expanded={expanded} onToggle={toggle} />
      </div>
    </div>
  )
}

function TreeNodeRow({
  node,
  level,
  expanded,
  onToggle,
}: {
  node: OkrTreeNode
  level: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isOpen = expanded.has(node.id)
  const indent = level * 24

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 hover:bg-muted/40 rounded px-2 cursor-pointer',
          level === 0 && 'border-b border-border mb-2 pb-3',
        )}
        style={{ paddingLeft: indent }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}

        <NodeIcon node={node} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium truncate',
                level === 0 && 'text-base',
                level > 0 && 'text-sm',
              )}
            >
              {node.title}
            </span>
            {node.weight !== undefined && (
              <span className="text-xs text-muted-foreground">w={(node.weight * 100).toFixed(0)}%</span>
            )}
            {node.alignedTo && node.alignedTo.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400"
                title={node.alignedTo.map((a) => `${a.type} ${a.krTitle}`).join(', ')}
              >
                <Link2 className="w-3 h-3" />
                alignment {node.alignedTo.length}
              </span>
            )}
          </div>
          {node.contributingTaskIds && node.contributingTaskIds.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              매핑된 Critical 6 task: {node.contributingTaskIds.length}건
            </p>
          )}
        </div>

        <ProgressBadge progress={node.progress} status={node.status} />
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NodeIcon({ node }: { node: OkrTreeNode }) {
  if (node.type === 'objective') {
    return <Target className="w-4 h-4 text-primary shrink-0" />
  }
  if (node.type === 'keyresult') {
    if (node.status === 'achieved') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
    if (node.status === 'behind') return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
    if (node.status === 'at_risk') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
    return <span className="w-4 h-4 rounded-full border-2 border-emerald-500 shrink-0" />
  }
  return <span className="w-4 h-4 shrink-0" />
}

function ProgressBadge({ progress, status }: { progress: number | null; status: string }) {
  if (progress === null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">데이터 없음</span>
    )
  }
  const pct = Math.round(progress * 100)
  const color =
    status === 'achieved'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'behind'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      : status === 'at_risk'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            status === 'achieved'
              ? 'bg-emerald-500'
              : status === 'behind'
              ? 'bg-rose-500'
              : status === 'at_risk'
              ? 'bg-amber-500'
              : 'bg-blue-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium tabular-nums', color)}>
        {pct}%
      </span>
    </div>
  )
}
