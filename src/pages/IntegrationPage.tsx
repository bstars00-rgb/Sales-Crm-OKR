import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  ChevronDown,
  Diamond,
  Copy,
  Mail,
  AlertTriangle,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockProjects, mockWorkload, type Project } from '@/mocks/integration'
import { toast } from 'sonner'

type StatusType = Project['status']

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; barColor: string }> = {
  Planning: { label: '기획', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', barColor: '#9ca3af' },
  'In Progress': { label: '진행중', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', barColor: '#3b82f6' },
  Testing: { label: '테스트', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', barColor: '#eab308' },
  Complete: { label: '완료', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', barColor: '#22c55e' },
}

const STATUS_ORDER: StatusType[] = ['Planning', 'In Progress', 'Testing', 'Complete']

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const GANTT_START = new Date('2025-10-01')
const GANTT_END = new Date('2026-11-01')
const GANTT_TOTAL_DAYS = Math.floor(
  (GANTT_END.getTime() - GANTT_START.getTime()) / (1000 * 60 * 60 * 24)
)

function dateToDayOffset(dateStr: string) {
  const d = new Date(dateStr)
  return Math.floor((d.getTime() - GANTT_START.getTime()) / (1000 * 60 * 60 * 24))
}

function dateToPercent(dateStr: string) {
  return (dateToDayOffset(dateStr) / GANTT_TOTAL_DAYS) * 100
}

/** Generate month labels for the Gantt header */
function getGanttMonths() {
  const months: { label: string; startPercent: number; widthPercent: number }[] = []
  const cur = new Date(GANTT_START)
  while (cur < GANTT_END) {
    const startOffset = Math.floor(
      (cur.getTime() - GANTT_START.getTime()) / (1000 * 60 * 60 * 24)
    )
    const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const endOffset = Math.floor(
      (Math.min(nextMonth.getTime(), GANTT_END.getTime()) - GANTT_START.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const monthIndex = cur.getMonth()
    const year = cur.getFullYear()
    const label = year === 2026 ? MONTHS[monthIndex] : `${MONTHS[monthIndex]}'25`
    months.push({
      label,
      startPercent: (startOffset / GANTT_TOTAL_DAYS) * 100,
      widthPercent: ((endOffset - startOffset) / GANTT_TOTAL_DAYS) * 100,
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

function generateAIReport(projects: Project[]) {
  const inProgress = projects.filter((p) => p.status === 'In Progress').length
  const testing = projects.filter((p) => p.status === 'Testing').length
  const complete = projects.filter((p) => p.status === 'Complete').length
  const avgProgress = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)

  return `## API 연동 프로젝트 현황 리포트

**작성일**: 2026년 3월 28일

### 요약
- 전체 프로젝트: ${projects.length}건
- 진행중: ${inProgress}건 | 테스트: ${testing}건 | 완료: ${complete}건
- 평균 진행률: ${avgProgress}%

### 주요 이슈
${
  mockWorkload
    .filter((w) => w.conflicts > 0)
    .map((w) => `- **${w.assignee}**: ${w.projectCount}개 프로젝트 동시 진행 중 (${w.conflicts}건 일정 겹침)`)
    .join('\n') || '- 현재 일정 충돌 없음'
}

### 권장 사항
1. Agoda Channel Manager 업그레이드 QA 테스트 집중 투입 필요
2. 김철수 담당자 업무 부하 분산 검토 권장
3. Expedia Rapid API 마이그레이션 기술 검토 일정 확인 필요`
}

export default function IntegrationPage() {
  const [projects, setProjects] = useState<Project[]>(() => [...mockProjects])
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const assignees = useMemo(
    () => Array.from(new Set(projects.map((p) => p.assignee))),
    [projects]
  )

  const filteredProjects = useMemo(() => {
    let data = [...projects]
    if (statusFilter !== 'all') data = data.filter((p) => p.status === statusFilter)
    if (assigneeFilter !== 'all') data = data.filter((p) => p.assignee === assigneeFilter)
    return data
  }, [projects, statusFilter, assigneeFilter])

  const ganttMonths = useMemo(() => getGanttMonths(), [])

  /** Today marker position */
  const todayPercent = useMemo(() => {
    const today = new Date('2026-03-28')
    return dateToPercent(today.toISOString().slice(0, 10))
  }, [])

  function cycleStatus(id: string) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const idx = STATUS_ORDER.indexOf(p.status)
        const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
        toast.success(`${p.name}: ${STATUS_CONFIG[p.status].label} → ${STATUS_CONFIG[next].label}`)
        return { ...p, status: next }
      })
    )
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setDeleteConfirm(null)
      toast.success('프로젝트가 삭제되었습니다.')
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function handleAddProject() {
    toast.info('프로젝트 추가 기능은 추후 제공됩니다.')
  }

  function handleCopyReport() {
    navigator.clipboard.writeText(generateAIReport(projects))
    toast.success('리포트가 클립보드에 복사되었습니다.')
  }

  function handleEmailReport() {
    toast.info('이메일 전송 기능은 추후 제공됩니다.')
  }

  // Workload heatmap data
  const workloadHeatmap = useMemo(() => {
    const map: Record<string, boolean[]> = {}
    assignees.forEach((a) => {
      map[a] = new Array(12).fill(false)
    })
    projects.forEach((p) => {
      const startMonth = new Date(p.startDate).getMonth()
      const endMonth = new Date(p.endDate).getMonth()
      const startYear = new Date(p.startDate).getFullYear()
      const endYear = new Date(p.endDate).getFullYear()
      for (let y = startYear; y <= endYear; y++) {
        const mStart = y === startYear ? startMonth : 0
        const mEnd = y === endYear ? endMonth : 11
        if (y === 2026) {
          for (let m = mStart; m <= mEnd; m++) {
            if (map[p.assignee]) {
              map[p.assignee][m] = true
            }
          }
        }
      }
    })
    return map
  }, [projects, assignees])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API 연동 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            파트너 API 연동 프로젝트 타임라인 및 리소스 관리
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            프로젝트 추가
          </button>

          <div className="flex items-center gap-1.5 bg-card border rounded-lg px-3 py-1.5">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusType | 'all')}
              className="text-sm bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="all">전체 상태</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-card border rounded-lg px-3 py-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-sm bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="all">전체 담당자</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            프로젝트 타임라인
          </h2>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Month headers */}
            <div className="flex border-b bg-muted/30">
              <div className="w-44 shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r">
                프로젝트
              </div>
              <div className="flex-1 relative flex">
                {ganttMonths.map((m, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground py-2 text-center border-r border-border/50"
                    style={{ width: `${m.widthPercent}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Project rows */}
            {filteredProjects.map((project) => {
              const config = STATUS_CONFIG[project.status]
              const startPct = Math.max(0, dateToPercent(project.startDate))
              const endPct = Math.min(100, dateToPercent(project.endDate))
              const widthPct = endPct - startPct

              return (
                <div key={project.id} className="flex border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  {/* Project name */}
                  <div className="w-44 shrink-0 px-3 py-3 border-r flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: config.barColor }} />
                    <span className="text-xs font-medium truncate">{project.name}</span>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative py-2 px-1">
                    {/* Today marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10"
                      style={{ left: `${todayPercent}%` }}
                    />

                    {/* Project bar */}
                    <div
                      className="relative h-7 rounded-md cursor-pointer group"
                      style={{
                        marginLeft: `${startPct}%`,
                        width: `${widthPct}%`,
                        background: `${config.barColor}30`,
                        border: `1px solid ${config.barColor}50`,
                      }}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-l-md transition-all"
                        style={{
                          width: `${project.progress}%`,
                          background: `${config.barColor}60`,
                        }}
                      />

                      {/* Progress text */}
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground/80 z-10">
                        {project.progress}%
                      </div>

                      {/* Milestones */}
                      {project.milestones.map((ms, idx) => {
                        const msOffset = dateToDayOffset(ms.date)
                        const barStart = dateToDayOffset(project.startDate)
                        const barEnd = dateToDayOffset(project.endDate)
                        const barDays = barEnd - barStart
                        if (barDays <= 0) return null
                        const msPct = ((msOffset - barStart) / barDays) * 100

                        return (
                          <div
                            key={idx}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/ms"
                            style={{ left: `${msPct}%` }}
                          >
                            <Diamond
                              className={cn(
                                'w-3 h-3',
                                ms.done
                                  ? 'text-green-500 fill-green-500'
                                  : 'text-foreground/50'
                              )}
                            />
                            {/* Milestone tooltip */}
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/ms:block bg-popover border rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg z-50">
                              {ms.name}
                              <br />
                              <span className="text-muted-foreground">{ms.date}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Project List Table + Workload Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Project Table */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">프로젝트 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">상태</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">프로젝트명</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">클라이언트</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">담당자</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">기간</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">진행률</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const config = STATUS_CONFIG[project.status]
                  return (
                    <tr key={project.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => cycleStatus(project.id)}
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                            config.bg,
                            config.color
                          )}
                          title="클릭하여 상태 변경"
                        >
                          {config.label}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{project.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{project.client}</td>
                      <td className="px-4 py-2.5">{project.assignee}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {project.startDate} ~ {project.endDate}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${project.progress}%`,
                                background: config.barColor,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {project.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className={cn(
                            'p-1 rounded transition-colors',
                            deleteConfirm === project.id
                              ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                              : 'text-muted-foreground hover:text-red-500'
                          )}
                          title={deleteConfirm === project.id ? '한번 더 클릭하여 삭제 확인' : '삭제'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workload Panel */}
        <div className="space-y-4">
          {/* Assignee workload cards */}
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">담당자 업무 부하</h2>
            </div>
            <div className="p-3 space-y-2">
              {mockWorkload.map((w) => (
                <div
                  key={w.assignee}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    w.conflicts > 0
                      ? 'border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : 'bg-background'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{w.assignee}</span>
                    <span className="text-xs text-muted-foreground">
                      {w.projectCount}개 프로젝트
                    </span>
                  </div>
                  {w.conflicts > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="w-3 h-3" />
                      {w.conflicts}개 프로젝트 일정 겹침
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resource heatmap */}
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">리소스 히트맵 (2026)</h2>
            </div>
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left px-1 py-1 text-muted-foreground font-medium">담당자</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="text-center px-0.5 py-1 text-muted-foreground font-medium">
                        {m.replace('월', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignees.map((a) => (
                    <tr key={a}>
                      <td className="px-1 py-1 font-medium whitespace-nowrap">{a}</td>
                      {workloadHeatmap[a]?.map((active, i) => {
                        // Count how many projects this person has in this month
                        const count = projects.filter((p) => {
                          if (p.assignee !== a) return false
                          const s = new Date(p.startDate)
                          const e = new Date(p.endDate)
                          const mStart = new Date(2026, i, 1)
                          const mEnd = new Date(2026, i + 1, 0)
                          return s <= mEnd && e >= mStart
                        }).length
                        return (
                          <td key={i} className="px-0.5 py-1 text-center">
                            <div
                              className={cn(
                                'w-5 h-5 rounded-sm mx-auto flex items-center justify-center text-[9px] font-medium',
                                count === 0
                                  ? 'bg-muted/50'
                                  : count === 1
                                    ? 'bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                    : count === 2
                                      ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                      : 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                              )}
                            >
                              {count > 0 ? count : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>범례:</span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-muted/50" /> 없음
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/40" /> 1건
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-900/40" /> 2건
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/40" /> 3건+
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Report */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI 분석 리포트
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs hover:bg-accent transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              복사
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs hover:bg-accent transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              이메일
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <h3 className="text-base font-semibold mb-3">API 연동 프로젝트 현황 리포트</h3>
            <p className="text-xs text-muted-foreground mb-4">작성일: 2026년 3월 28일</p>

            <h4 className="text-sm font-semibold mb-2">요약</h4>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: '전체 프로젝트', value: projects.length, unit: '건' },
                {
                  label: '진행중',
                  value: projects.filter((p) => p.status === 'In Progress').length,
                  unit: '건',
                },
                {
                  label: '테스트',
                  value: projects.filter((p) => p.status === 'Testing').length,
                  unit: '건',
                },
                {
                  label: '평균 진행률',
                  value: Math.round(
                    projects.reduce((s, p) => s + p.progress, 0) / projects.length
                  ),
                  unit: '%',
                },
              ].map((item) => (
                <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">
                    {item.value}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">{item.unit}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-semibold mb-2">주요 이슈</h4>
            <ul className="text-xs space-y-1 mb-4 list-none p-0">
              {mockWorkload
                .filter((w) => w.conflicts > 0)
                .map((w) => (
                  <li key={w.assignee} className="flex items-start gap-2 py-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                    <span>
                      <strong>{w.assignee}</strong>: {w.projectCount}개 프로젝트 동시 진행 중 ({w.conflicts}건 일정 겹침)
                    </span>
                  </li>
                ))}
            </ul>

            <h4 className="text-sm font-semibold mb-2">권장 사항</h4>
            <ol className="text-xs space-y-1 list-decimal pl-4">
              <li>Agoda Channel Manager 업그레이드 QA 테스트 집중 투입 필요</li>
              <li>김철수 담당자 업무 부하 분산 검토 권장</li>
              <li>Expedia Rapid API 마이그레이션 기술 검토 일정 확인 필요</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
