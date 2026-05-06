// Critical 6 PRD v1 — Mock 데이터
// 6명 직원 × 5일치 = 약 90~120건 Task (Round 11 Sprint 1 Foundation)
import type {
  Task, TaskStatus, TaskImportance, TaskRank,
  DailyCritical6, Critical6Comment, TaskStatusHistory,
} from '@/types'

// 5단계 상태 + UX 메타 (Skipped는 legacy)
export const C6_STATUS_DEFS: { code: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { code: 'Planned', label: 'To Do', color: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-500/15 border-slate-500/30' },
  { code: 'InProgress', label: 'In Progress', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-500/15 border-blue-500/30' },
  { code: 'Waiting', label: 'Waiting', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-500/15 border-amber-500/30' },
  { code: 'Done', label: 'Done', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-500/15 border-emerald-500/30' },
  // { code: 'Blocked', ... } — Round 16: Blocked 단계 제거 (Waiting으로 통합)
]

export const IMPORTANCE_LABELS: Record<TaskImportance, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

// 어제 / 오늘 / 그제 ISO 날짜 헬퍼 (KST)
function today(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}
function dueAt(daysAhead: number, hour: number, min = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

// 6명 sales 직원 (mocks/users.ts SALES_PICS 기반)
const USERS = ['u-sales-1', 'u-sales-2', 'u-sales-3', 'u-sales-4', 'u-sales-5', 'u-sales-6'] as const

let seq = 1
const id = (prefix = 'task') => `${prefix}-${String(seq++).padStart(4, '0')}`

// ============ Helper: Task 생성 ============
function makeTask(args: Partial<Task> & { ownerUserId: string; date: string; rank: TaskRank; title: string }): Task {
  const now = new Date().toISOString()
  return {
    id: id('task'),
    ownerUserId: args.ownerUserId,
    date: args.date,
    rank: args.rank,
    channelId: args.channelId,
    category: args.category ?? 'NewDeal',
    title: args.title,
    expectedOutcome: args.expectedOutcome,
    status: args.status ?? 'Planned',
    doneAt: args.doneAt,
    doneActivityIds: args.doneActivityIds,
    resultNote: args.resultNote,
    carryOver: args.carryOver ?? false,
    createdAt: args.createdAt ?? now,
    updatedAt: args.updatedAt ?? now,
    description: args.description,
    importance: args.importance ?? 2,
    collaborators: args.collaborators ?? [],
    dueAt: args.dueAt,
    blockedReason: args.blockedReason,
    carriedOverFrom: args.carriedOverFrom,
    carryCount: args.carryCount ?? 0,
    attachments: args.attachments ?? [],
    // Round 16 Phase D — 날짜/시간 고도화 (옵션)
    startDate: args.startDate,
    dueDate: args.dueDate,
    multiDay: args.multiDay,
    // Round 16 Phase E — Eisenhower
    urgency: args.urgency,
    // Round 16 OKR 매핑
    linkedKrId: args.linkedKrId,
  }
}

// ============ Mock Tasks (오늘 6 × 6명 = 36건) ============
export const mockCritical6Tasks: Task[] = [
  // ===== u-sales-1 (김세일, CN 담당) — 오늘 =====
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 1, channelId: 'c2', title: 'Trip.com Q3 단가 협상 미팅', importance: 3, dueAt: dueAt(0, 10), status: 'Done', doneAt: dueAt(0, 10, 30), description: '오전 10시 화상 미팅, 단가 5% 인하 제안 검토' }),
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 2, channelId: 'c11', title: 'Ctrip Wholesale 신규 통합 계약서 검토', importance: 3, dueAt: dueAt(0, 14), status: 'InProgress', collaborators: ['u-tmgr'] }),
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 3, title: '주간 매출 보고서 작성', importance: 2, dueAt: dueAt(0, 17), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 4, channelId: 'c2', title: 'Trip.com 결제 정보 확인', importance: 2, status: 'Waiting', description: '재무팀 회신 대기 중' }),
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 5, channelId: 'c11', title: 'Ctrip 법무 검토 요청', importance: 1, status: 'Waiting', blockedReason: '내부 법무팀 4일째 회신 없음', carryCount: 4 }),
  makeTask({ ownerUserId: 'u-sales-1', date: today(), rank: 6, title: '내일 미팅 자료 준비', importance: 1, dueAt: dueAt(0, 18), status: 'Planned' }),

  // ===== u-sales-2 (박영업, JP 담당) =====
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 1, channelId: 'c1', title: 'HanaTour Japan 분기 리뷰 미팅', importance: 3, dueAt: dueAt(0, 11), status: 'Done', doneAt: dueAt(0, 11, 45) }),
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 2, channelId: 'c4', title: 'Yanolja 신규 상품 등록 검토', importance: 3, status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 3, title: '일본 권역 KPI 데이터 정리', importance: 2, dueAt: dueAt(0, 16), status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 4, channelId: 'c1', title: 'HanaTour 인보이스 처리', importance: 2, status: 'Done', doneAt: dueAt(0, 14) }),
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 5, title: '주간 회의 안건 작성', importance: 1, dueAt: dueAt(0, 17), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-2', date: today(), rank: 6, title: '신규 고객 리스트 검토', importance: 1, status: 'Planned' }),

  // ===== u-sales-3 (이채널, SEA 담당) =====
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 1, channelId: 'c8', title: 'Traveloka 프로모션 협상', importance: 3, dueAt: dueAt(0, 13), status: 'InProgress', collaborators: ['u-dir'] }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 2, channelId: 'c12', title: 'Tiket.com Q3 계약 갱신', importance: 3, status: 'Waiting', description: 'SG 본사 승인 대기' }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 3, channelId: 'c5', title: 'Booking.com 권역 확장 제안', importance: 2, status: 'Waiting', blockedReason: '경쟁사 입찰 정보 미확보', carryCount: 2 }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 4, title: 'SEA 시장 동향 리포트', importance: 2, dueAt: dueAt(0, 17), status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 5, channelId: 'c8', title: 'Traveloka 결제 사이클 변경', importance: 1, status: 'Done', doneAt: dueAt(0, 15) }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(), rank: 6, title: '신규 채널 5개 발굴 리스트업', importance: 1, status: 'Planned' }),

  // ===== u-sales-4 (최영남, SA 담당) =====
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 1, channelId: 'c7', title: 'MakeMyTrip 본사 방문 준비', importance: 3, dueAt: dueAt(1, 9), status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 2, title: '인도 권역 분기 매출 리뷰', importance: 3, dueAt: dueAt(0, 16), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 3, channelId: 'c7', title: 'MakeMyTrip 갱신 계약서 초안', importance: 2, status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 4, title: 'SA 권역 신규 채널 미팅', importance: 2, dueAt: dueAt(0, 14), status: 'Done', doneAt: dueAt(0, 15) }),
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 5, title: '주간 리포트 작성', importance: 1, dueAt: dueAt(0, 18), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-4', date: today(), rank: 6, title: '내일 출장 짐 정리', importance: 1, status: 'Planned' }),

  // ===== u-sales-5 (Sarah Chen, CN/HK/TW) =====
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 1, channelId: 'c11', title: 'Ctrip Wholesale 분기 정산', importance: 3, dueAt: dueAt(0, 12), status: 'Done', doneAt: dueAt(0, 13) }),
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 2, title: 'TW/HK 고객 만족도 조사', importance: 2, dueAt: dueAt(0, 17), status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 3, channelId: 'c11', title: 'Ctrip 신규 호텔 200개 데이터 검증', importance: 3, status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 4, title: '대만 법인 미팅 자료', importance: 2, dueAt: dueAt(2, 10), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 5, title: '홍콩 결제 시스템 개선안', importance: 1, status: 'Waiting' }),
  makeTask({ ownerUserId: 'u-sales-5', date: today(), rank: 6, title: '월간 매출 분석 시작', importance: 1, status: 'Planned' }),

  // ===== u-sales-6 (Linh Nguyen, VN) =====
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 1, channelId: 'c8', title: 'Traveloka VN 사무실 방문', importance: 3, dueAt: dueAt(0, 14), status: 'Done', doneAt: dueAt(0, 16) }),
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 2, title: 'VN 권역 신규 OTA 발굴', importance: 3, status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 3, channelId: 'c8', title: 'Traveloka 환율 조정 협상', importance: 2, status: 'Waiting', blockedReason: '본사 재무 정책 변경 대기', carryCount: 5 }),
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 4, title: 'VN 분기 보고서 작성', importance: 2, dueAt: dueAt(0, 17), status: 'Planned' }),
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 5, title: '신규 호텔 paperwork 정리', importance: 1, status: 'InProgress' }),
  makeTask({ ownerUserId: 'u-sales-6', date: today(), rank: 6, title: '주간 동기화 미팅 참석', importance: 1, dueAt: dueAt(1, 10), status: 'Planned' }),

  // ===== 어제 미완료 → 오늘 carry-over 후보 (별도 user 기록) =====
  makeTask({ ownerUserId: 'u-sales-1', date: today(-1), rank: 5, title: '거래처 미수금 회수 독촉', importance: 2, status: 'Waiting', carriedOverFrom: 'task-prev-001', carryCount: 1 }),
  makeTask({ ownerUserId: 'u-sales-3', date: today(-1), rank: 4, title: 'Booking 권역 분석 자료 정리', importance: 1, status: 'Planned', carryCount: 0 }),

  // ===== Round 16 Phase D — 미래 task 시연용 =====
  // 내일 (u-sales-1)
  makeTask({
    ownerUserId: 'u-sales-1', date: today(1), rank: 1,
    title: 'Trip.com 분기 정산 회의 준비',
    importance: 3, urgency: 'urgent', status: 'Planned',
    startDate: today(1), dueDate: today(1),
    linkedKrId: 'kr-s-2',
  }),
  makeTask({
    ownerUserId: 'u-sales-1', date: today(1), rank: 2,
    title: 'Booking.com 신규 통합 NDA 서명',
    importance: 3, urgency: 'normal', status: 'Planned',
    startDate: today(1), dueDate: today(2), multiDay: true,
    linkedKrId: 'kr-s-1',
  }),
  // 모레 multi-day task (u-sales-1)
  makeTask({
    ownerUserId: 'u-sales-1', date: today(2), rank: 1,
    title: 'Q3 채널 실적 보고서 (2일 작업)',
    importance: 2, urgency: 'normal', status: 'Planned',
    startDate: today(2), dueDate: today(3), multiDay: true,
    linkedKrId: 'kr-s-2',
  }),
  // 내일 (u-sales-2)
  makeTask({
    ownerUserId: 'u-sales-2', date: today(1), rank: 1,
    title: 'Yanolja 파트너십 미팅 (오프라인)',
    importance: 3, urgency: 'urgent', status: 'Planned',
    startDate: today(1), dueDate: today(1),
    linkedKrId: 'kr-s-3',
  }),
  // 다음 주 task (u-sales-1) — 일주일 multi-day
  makeTask({
    ownerUserId: 'u-sales-1', date: today(7), rank: 1,
    title: 'B2B Travel Agent partnership 후보 5곳 시장조사 (일주일)',
    importance: 2, urgency: 'normal', status: 'Planned',
    startDate: today(7), dueDate: today(13), multiDay: true,
    linkedKrId: 'kr-s-4',
  }),
]

// ============ DailyCritical6 (오늘 6명) ============
export const mockDailyCritical6: DailyCritical6[] = USERS.map((userId) => ({
  id: `dc6-${userId.replace('u-', '')}-${today()}`,
  userId,
  date: today(),
  taskCount: 6,
  status: 'submitted',
  submittedAt: dueAt(0, 9, 5),
  carryOverCount: userId === 'u-sales-1' ? 1 : 0,
  durationSeconds: 165, // 평균 ~2.75분
}))

// ============ Comments (예시 5건) ============
export const mockCritical6Comments: Critical6Comment[] = [
  {
    id: 'cm-001',
    taskId: 'task-0002',
    authorId: 'u-tmgr',
    body: 'Ctrip Wholesale 계약서 35조 (위약금) 부분 추가 검토 필요. @u-sales-1 확인 부탁',
    mentions: ['u-sales-1'],
    attachments: [],
    createdAt: dueAt(0, 11, 20),
  },
  {
    id: 'cm-002',
    taskId: 'task-0005',
    authorId: 'u-tmgr',
    body: '4일째 Blocked는 너무 길어. 내가 직접 법무팀에 핀 박을게.',
    mentions: [],
    attachments: [],
    createdAt: dueAt(0, 14),
  },
  {
    id: 'cm-003',
    taskId: 'task-0013',
    authorId: 'u-dir',
    body: 'Traveloka 협상 핵심 포인트는 단가 + 결제 사이클. 내가 직접 합류해서 진행하자.',
    mentions: ['u-sales-3'],
    attachments: [],
    createdAt: dueAt(0, 13, 5),
  },
  {
    id: 'cm-004',
    taskId: 'task-0015',
    authorId: 'u-dir',
    body: 'Booking 경쟁사 정보는 영업기획팀에 요청해뒀어요. 1주일 내 회신 예상.',
    mentions: ['u-sales-3'],
    attachments: [],
    createdAt: dueAt(0, 15, 30),
  },
  {
    id: 'cm-005',
    taskId: 'task-0033',
    authorId: 'u-tmgr',
    body: '5일째 Blocked. 본사 정책 결정 시점 명확하지 않으면 Lost로 마감하는 것도 검토',
    mentions: ['u-sales-6'],
    attachments: [],
    createdAt: dueAt(0, 16, 10),
  },
]

// ============ StatusHistory (예시 — 상태 변경 이력) ============
export const mockTaskStatusHistory: TaskStatusHistory[] = [
  { id: 'sh-001', taskId: 'task-0001', fromStatus: 'Planned', toStatus: 'InProgress', changedBy: 'u-sales-1', changedAt: dueAt(0, 9, 50) },
  { id: 'sh-002', taskId: 'task-0001', fromStatus: 'InProgress', toStatus: 'Done', changedBy: 'u-sales-1', changedAt: dueAt(0, 10, 30) },
  { id: 'sh-003', taskId: 'task-0005', fromStatus: 'Planned', toStatus: 'Blocked', changedBy: 'u-sales-1', changedAt: dueAt(-3, 11), reason: '내부 법무팀 4일째 회신 없음' },
  { id: 'sh-004', taskId: 'task-0015', fromStatus: 'InProgress', toStatus: 'Blocked', changedBy: 'u-sales-3', changedAt: dueAt(-1, 16), reason: '경쟁사 입찰 정보 미확보' },
  { id: 'sh-005', taskId: 'task-0033', fromStatus: 'InProgress', toStatus: 'Blocked', changedBy: 'u-sales-6', changedAt: dueAt(-4, 14), reason: '본사 재무 정책 변경 대기' },
]

// ============ 유틸 함수 ============

// 사용자별 오늘 Task
export function getTodayTasksByUser(userId: string, dateOverride?: string): Task[] {
  const date = dateOverride ?? today()
  return mockCritical6Tasks
    .filter((t) => t.ownerUserId === userId && t.date === date)
    .sort((a, b) => a.rank - b.rank)
}

// 팀 전체 오늘 Task
export function getTodayTasksAllUsers(dateOverride?: string): Task[] {
  const date = dateOverride ?? today()
  return mockCritical6Tasks
    .filter((t) => t.date === date)
    .sort((a, b) => (a.ownerUserId.localeCompare(b.ownerUserId)) || (a.rank - b.rank))
}

// 사용자별 진행 통계 (팀장 대시보드용)
export function getUserProgress(userId: string, dateOverride?: string) {
  const tasks = getTodayTasksByUser(userId, dateOverride)
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'Done').length
  const inProgress = tasks.filter((t) => t.status === 'InProgress').length
  const waiting = tasks.filter((t) => t.status === 'Waiting').length
  const blocked = tasks.filter((t) => t.status === 'Blocked').length
  const completionRate = total > 0 ? done / total : 0
  return { total, done, inProgress, waiting, blocked, completionRate, tasks }
}

// Carry-over 후보 (어제 미완료)
export function getCarryOverCandidates(userId: string): Task[] {
  return mockCritical6Tasks.filter(
    (t) => t.ownerUserId === userId && t.date === today(-1) && t.status !== 'Done'
  )
}

// 오늘의 댓글
export function getCommentsByTask(taskId: string): Critical6Comment[] {
  return mockCritical6Comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
