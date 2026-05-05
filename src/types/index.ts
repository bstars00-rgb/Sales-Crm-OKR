// ========== User & Auth (FR-001, BR-001-3 7직급 RBAC) ==========
export type UserRole =
  | 'ceo'
  | 'c_level'
  | 'regional_director'
  | 'director'
  | 'team_manager'
  | 'part_manager'
  | 'team_member'

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  c_level: 'C-Level',
  regional_director: 'Regional Director',
  director: 'Director',
  team_manager: 'Team Manager',
  part_manager: 'Part Manager',
  team_member: 'Team Member',
}

export const ROLE_RANK: Record<UserRole, number> = {
  ceo: 7,
  c_level: 6,
  regional_director: 5,
  director: 4,
  team_manager: 3,
  part_manager: 2,
  team_member: 1,
}

export type LangCode = 'ko' | 'en' | 'vi'
export type ThemePreference = 'light' | 'dark' | 'system'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  region?: 'EA' | 'SEA' | 'SA' | 'ME' | 'OC'
  partId?: string // Part Manager 동일 Part 조회용
  assignedClients?: string[] // PIC 매핑 (channel ids)
  language: LangCode
  themePreference: ThemePreference
  onboardedAt?: string // FR-025
  azureAdGroups?: string[] // Azure AD JWT claims (Phase 1.5)
}

// ========== Channel (구 Client, FR-006) ==========
export type ChannelType = 'OTA' | 'Wholesaler' | 'Corporate' | 'TMC' | 'Meta'
export type Region = 'EA' | 'SEA' | 'SA' | 'ME' | 'OC'
// OQ-007: Tier 1(전략) / 2(성장) / 3(신규). 0/4는 legacy 호환을 위해 유니언에 포함
export type Tier = 0 | 1 | 2 | 3 | 4
export type PipelineStage = 'Contact' | 'NDA' | 'InDev' | 'Testing' | 'Live'
export type ContractStatus = 'Active' | 'Pending' | 'Expired' | 'Suspended' | 'Inactive'
export type SettlementType = 'Weekly' | 'Monthly' | 'Net30' | 'Net60'

export interface Contact {
  id: string
  name: string
  title: string
  role: 'Primary' | 'Secondary' | 'Finance'
  email: string
  phone: string
  birthday?: string
}

export interface Channel {
  id: string
  name: string
  contacts: Contact[]

  // ===== 신규 (Spec) =====
  sellerNameAliases?: string[]
  countryCode?: string
  region: Region | 'East Asia' | 'SE Asia' | 'South Asia' | 'Middle East' | 'Oceania'
  tier?: Tier
  channelType?: ChannelType
  pipelineStage?: PipelineStage
  picUserId?: string

  ttvJPY?: number
  revenueJPY?: number
  rn?: number
  bookings?: number
  shareOfTTV?: number
  ttvWoW?: number
  bookingsWoW?: number

  contractStatus?: ContractStatus
  contractStartDate?: string
  settlement?: SettlementType
  creditLimitJPY?: number
  creditUsageJPY?: number

  notes?: string
  isFavorite?: boolean
  createdAt?: string
  updatedAt?: string

  // ===== Legacy (기존 페이지 점진 이행용) =====
  status?: ContractStatus
  autoTier?: Tier | 0 | 4 // alias 기존 0~4 호환
  targetTier?: Tier | 0 | 4 | null
  country?: string
  assignedManager?: string
  contractEntity?: string
  markupPercent?: number
  supplyCurrency?: string
  paymentTerms?: string
  depositType?: string
  depositAmount?: number
  opContacts?: { ours: string; theirs: string }
  creditLimit?: number
  creditUsage?: number
  creditUsagePercent?: number
  lastYearRevenue?: number
  ytdTTV?: number
  ytdRevenue?: number
  ytdRoomNights?: number
  ytdBookings?: number
  rank?: number
  sharePercent?: number
}

// 호환성 (기존 코드 점진 이행용)
export type Client = Channel
export type ClientStatus = ContractStatus
export type TierLevel = Tier

// ========== Activity (FR-003 HubSpot 스타일) ==========
export type ActivityType =
  | 'Email'
  | 'Call'
  | 'Meeting'
  | 'Note'
  | 'Contract'
  | 'Issue'
  | 'Promotion'
  | 'Visit'

export interface Activity {
  id: string
  channelId: string
  authorUserId: string
  type: ActivityType
  occurredAt: string
  durationMin?: number
  subject: string
  content: string
  action?: string
  note?: string
  relatedTaskId?: string
  relatedContactId?: string
  attachments?: string[]
  source: 'manual' | 'email-sync' | 'auto'
  createdAt: string
  updatedAt: string
}

// ========== Critical 6 Task (FR-002) ==========
export type TaskCategory =
  | 'NewDeal'
  | 'Promotion'
  | 'Issue'
  | 'Contract'
  | 'Pipeline'
  | 'Internal'
  | 'Follow-up'

// 기존 4값 + Critical 6 PRD v1에서 추가한 'Waiting' / 'Blocked' = 6값
// (Skipped는 후방 호환용 유지, 신규 작성은 5값만 사용)
export type TaskStatus = 'Planned' | 'InProgress' | 'Waiting' | 'Done' | 'Blocked' | 'Skipped'
export type TaskRank = 1 | 2 | 3 | 4 | 5 | 6
export type TaskImportance = 1 | 2 | 3 // ⭐~⭐⭐⭐ (Critical 6 PRD)

export interface Task {
  id: string
  ownerUserId: string
  date: string // YYYY-MM-DD
  rank: TaskRank
  channelId?: string
  category: TaskCategory
  title: string
  expectedOutcome?: string
  status: TaskStatus
  doneAt?: string
  doneActivityIds?: string[]
  resultNote?: string
  carryOver?: boolean
  createdAt: string
  updatedAt: string
  // ===== Round 11 Critical 6 PRD v1 확장 (모두 옵션) =====
  description?: string         // 상세 설명 (최대 2000자)
  importance?: TaskImportance  // 중요도 (1~3)
  collaborators?: string[]     // 협업자 userId[]
  dueAt?: string              // ISO8601 마감시간
  blockedReason?: string      // status=Blocked 시 필수 (10자 이상)
  carriedOverFrom?: string    // 어제 미완료 → 오늘 이월된 원본 Task id
  carryCount?: number         // 이월 횟수 (3+ 시 자동 경고)
  attachments?: TaskAttachment[]
  // ===== Round 14 OKR Platform consumer 매핑 (옵션, 모두 nullable) =====
  linkedObjectiveId?: string             // OKR Platform Objective.id 외부 참조
  linkedKrId?: string                    // OKR Platform KeyResult.id (가장 일반적)
  linkedGoalId?: string                  // OKR Platform StrategicGoal.id 외부 참조
  contributionWeight?: number            // 0~1, 자동 정규화 결과
  okrContributionId?: string             // OKR Platform이 발급한 KrContribution.id
  // 옵션 (Phase 2): projectId, customCategoryTags
}

// Critical 6 PRD: 첨부파일/링크
export interface TaskAttachment {
  id: string
  type: 'file' | 'link'
  url: string
  name: string
  size?: number               // bytes (file only)
  uploadedBy: string
  uploadedAt: string
}

// Critical 6 PRD: 일일 작성 단위 (DailyCritical6)
export interface DailyCritical6 {
  id: string                              // dc6-{nanoid}
  userId: string
  date: string                            // YYYY-MM-DD (KST)
  taskCount: 0 | 1 | 2 | 3 | 4 | 5 | 6
  status: 'draft' | 'submitted' | 'finalized'
  submittedAt?: string
  carryOverCount: number                  // 어제로부터 이월된 항목 수
  startTime?: string                      // 작성 시작
  finishTime?: string
  durationSeconds?: number                // 3분 이하 목표
}

// Critical 6 PRD: 댓글
export interface Critical6Comment {
  id: string                              // cm-{nanoid}
  taskId: string
  authorId: string
  body: string                            // 마크다운 (멘션 @user 자동 인식)
  mentions: string[]                      // userId[]
  attachments: TaskAttachment[]
  createdAt: string
  editedAt?: string
}

// Critical 6 PRD: 상태 이력
export interface TaskStatusHistory {
  id: string
  taskId: string
  fromStatus: TaskStatus | null
  toStatus: TaskStatus
  changedBy: string                       // userId
  changedAt: string
  reason?: string                         // status=Blocked 시 필수
}

// ========== Daily Briefing (FR-004) ==========
// 'EditRequested'는 Submitted 후 24h 초과 + 수정 요청 시 Manager 승인 대기 상태
export type BriefingStatus = 'Draft' | 'Submitted' | 'EditRequested'

export interface DailyBriefing {
  id?: string
  userId?: string
  date: string
  status?: BriefingStatus
  generatedAt?: string
  submittedAt?: string

  // 자동 집계 (loose to allow both old/new shapes)
  kpiChanges: {
    metric: string
    yesterday: number
    today: number
    change?: number
    changePercent: number
  }[]
  completedTasks?: string[]
  registeredActivities?: string[]
  channelsTouched?: number

  // 수동 입력
  issues?: string
  tomorrowActions?: string
  comment?: string

  // legacy fields
  urgentClients?: {
    clientId: string
    clientName: string
    reason: string
    severity: AlertSeverity
  }[]
  todaySchedule?: {
    time: string
    title: string
    type: string
  }[]
  actionItems?: {
    priority: 'high' | 'medium' | 'low'
    description: string
    clientName?: string
  }[]

  // new fields
  urgentChannels?: {
    channelId: string
    channelName: string
    reason: string
    severity: AlertSeverity
  }[]
}

// ========== Weekly Sales Brief (FR-005) ==========
export type BriefStatus = 'Draft' | 'UnderReview' | 'Confirmed' | 'Published'

export interface BriefItem {
  channelId?: string
  userId: string
  category: string
  title: string
  detail: string
  sourceActivityIds: string[]
}

export interface WeeklySalesBrief {
  id: string
  weekStartDate: string // YYYY-MM-DD (토요일)
  weekEndDate: string

  kpi: {
    bookings: number
    rn: number
    ttvJPY: number
    revenueJPY: number
    ctripSharePct: number
    chinaSharePct: number
    top3NonCtripPct: number
    bookingsWoW: number
    rnWoW: number
    ttvWoW: number
    revenueWoW: number
  }

  sections: {
    newChannelDeals: BriefItem[]
    openTesting: BriefItem[]
    promotionsSales: BriefItem[]
    issueResponses: BriefItem[]
    regionalHighlights: BriefItem[]
    nextWeekFocus: BriefItem[]
  }

  teamContribution: {
    userId: string
    activityCount: number
    taskDoneCount: number
    channelsTouched: number
  }[]

  decisionRequestIds: string[]

  status: BriefStatus
  generatedAt: string
  reviewedByUserId?: string
  confirmedAt?: string
  publishedAt?: string
  pdfUrl?: string
  pdfInternalUrl?: string
  shareToken?: string
  shareTokenExpiresAt?: string
}

// ========== Pipeline (FR-012) ==========
export interface PipelineStageHistory {
  id: string
  channelId: string
  fromStage: PipelineStage | null
  toStage: PipelineStage
  changedAt: string
  changedByUserId: string
  durationDays?: number
  notes?: string
}

// ========== Contract Change / SG Flip (FR-009) ==========
export type ContractChangeType =
  | 'SG-Flip'
  | 'Settlement-Change'
  | 'CreditLimit-Change'
  | 'Renewal'
export type ContractChangeStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected'

export interface ContractChange {
  id: string
  channelId: string
  type: ContractChangeType
  oldValue?: string
  newValue?: string
  contractDate: string
  followUpDate?: string
  completedDate?: string
  citiBankRef?: string
  status: ContractChangeStatus
  ownerUserId: string
  notes?: string
  rejectionReason?: string
}

// ========== Opportunity / Deal (FR-026) — Round 6 격상 ==========
export type OpportunityType = 'NewIntegration' | 'Promotion' | 'Renewal' | 'Upsell' | 'Expansion'
export type OpportunityStage = 'Contact' | 'NDA' | 'InDev' | 'Testing' | 'Won' | 'Lost'
export type OpportunityCurrency = 'JPY' | 'KRW' | 'USD'

// FR-027 Win/Loss Analysis lostReason enum
export type LostReason = 'Pricing' | 'Feature' | 'Competitor' | 'Timing' | 'Internal' | 'Other'

export interface Opportunity {
  id: string
  channelId: string
  name: string
  type: OpportunityType
  amount: number
  currency: OpportunityCurrency
  closeDate: string // ISO 8601
  probability: number // 0-100
  stage: OpportunityStage
  ownerUserId: string
  sourceActivityIds: string[]
  lostReason?: LostReason
  decisionNote?: string // Lost 전이 시 필수 (≥20자)
  createdAt: string
  updatedAt: string
}

// FR-028 Forecast Categories
export type ForecastCategory = 'Commit' | 'BestCase' | 'Pipeline' | 'Omitted'

// Channel.lifecycleStage (Round 6: Pipeline 단계와 분리)
export type ChannelLifecycle = 'New' | 'Active' | 'Renewing' | 'Churned'

// ========== Decision Request (FR-014) ==========
export type DecisionCategory = 'Pricing' | 'Contract' | 'Resource' | 'Strategy'
export type DecisionStatus = 'Open' | 'UnderReview' | 'Decided' | 'Deferred'
export type DecisionByRole = 'director' | 'ceo'

export interface DecisionRequest {
  id: string
  weeklyBriefId?: string
  requestedByUserId: string
  category: DecisionCategory
  title: string
  detail: string
  options: string[]
  decisionByRole: DecisionByRole
  status: DecisionStatus
  decidedAt?: string
  decision?: string
  decisionNote?: string
  createdAt: string
}

// ========== Promotion / GroupBooking (FR-018) ==========
export interface Promotion {
  id: string
  channelId: string
  name: string
  periodStart: string
  periodEnd: string
  discountPct: number
  expectedRN?: number
  status: 'Planned' | 'Active' | 'Ended' | 'Cancelled'
  createdByUserId: string
}

export interface GroupBooking {
  id: string
  channelId: string
  groupName: string
  checkIn: string
  checkOut: string
  roomCount: number
  totalTTV: number
  status: 'Pending' | 'Confirmed' | 'Cancelled'
  createdByUserId: string
}

// ========== KPI (캐스케이드 + 실적) ==========
export interface KPIData {
  ttv: number
  revenue: number
  roomNights: number
  bookings: number
  ttvYoY: number | null
  ttvMoM: number | null
  ttvWoW: number | null
  revenueYoY: number | null
  revenueMoM: number | null
  revenueWoW: number | null
  roomNightsYoY: number | null
  roomNightsMoM: number | null
  roomNightsWoW: number | null
  bookingsYoY: number | null
  bookingsMoM: number | null
  bookingsWoW: number | null
}

export interface KPITarget {
  annualTTV: number
  annualRevenue: number
  annualRoomNights: number
  quarters: {
    q1: { target: number; current: number }
    q2: { target: number; current: number }
    q3: { target: number; current: number }
    q4: { target: number; current: number }
  }
}

// FR-008 KPI Cascade
export interface CascadeL1 {
  year: number
  ttvTarget: number
  revenueTarget: number
  ctripCapPct: number // ≤35%
  chinaCapPct: number // ≤65%
}

export interface CascadeL2 {
  year: number
  region: Region
  pct: number // L1 대비 %
}

export interface TierWeight {
  tier: Tier
  weight: number // 50/30/20
}

export interface SeasonalityWeight {
  year: number
  month: number // 1~12
  weight: number // SCM CRM read-only (BR-008-5)
  source: 'SCM' | 'fallback'
  lastSyncedAt: string
}

// ========== Alert / Notification (FR-010) ==========
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'info' | 'warning' /* legacy */
export type AlertStatus = 'created' | 'read' | 'resolved'
export type AlertType =
  | 'credit_usage'
  | 'credit_overdue'
  | 'booking_surge'
  | 'booking_drop'
  | 'cancel_rate'
  | 'capacity_risk'
  | 'pipeline_stale'
  | 'ctrip_threshold_breach'
  | 'china_threshold_breach'
  | 'contract_expiring'
  | 'task_overdue'

export interface Alert {
  id: string
  channelId?: string
  channelName?: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  message: string
  value?: number
  threshold?: number
  streakDays?: number // BR-010-8 N일 연속
  createdAt: string
  readAt?: string
  resolvedAt?: string
  resolutionMemo?: string

  // legacy
  clientId?: string
  clientName?: string
}

export interface Notification {
  id: string
  userId?: string
  type: 'credit' | 'booking' | 'pipeline' | 'contract' | 'okr' | 'task' | 'system'
  title: string
  body?: string
  message?: string // legacy alias of body
  severity: AlertSeverity
  read: boolean
  link?: string
  createdAt: string
  linkedAlertId?: string
  linkedChannelId?: string
  linkedClientId?: string // legacy
}

// ========== Performance ==========
export type ChannelLegacy = 'OTA' | 'API' | 'Wholesale'

export interface ChannelData {
  channel: ChannelLegacy
  ttv: number
  revenue: number
  roomNights: number
  mixPercent: number
}

export interface MonthlyData {
  month: number
  ttv: number
  revenue: number
  roomNights: number
}

export interface QuarterData {
  quarter: string
  months: MonthlyData[]
  totalTTV: number
  totalRevenue: number
  totalRoomNights: number
}

// ========== Filters ==========
export interface GlobalFilters {
  clients: string[]
  countries: string[]
  hotels: string[]
  regions: Region[]
  tiers: Tier[]
  dateRange: { start: string; end: string }
  currency: 'JPY'
}

// ========== Comment ==========
export interface InlineComment {
  id: string
  targetType: 'kpi_card' | 'chart' | 'data_element'
  targetId: string
  authorId: string
  authorName: string
  content: string
  mentions: string[]
  createdAt: string
  updatedAt?: string
  isOrphan: boolean
}

// ========== Hotel / Market News ==========
export interface Hotel {
  id: string
  name: string
  country: string
  region: Region
  code: string
}

export interface MarketNews {
  id: string
  fetchedAt: string
  category: 'Macro' | 'Competitor'
  competitor?: string
  title: string
  summary: string
  sourceUrl: string
  publishedAt: string
  language: LangCode
}

// ========== OKR Platform (Round 14, FR-033/034/035) ==========
// 본 프로토타입은 OKR Platform을 mock OkrClient로 시뮬레이션.
// Production은 별도 OKR Platform 마이크로서비스 (okr-platform-prd.md).

export type ObjectiveScope = 'company' | 'division' | 'team' | 'individual'
export type ObjectiveStatus = 'draft' | 'active' | 'achieved' | 'partial' | 'missed' | 'cancelled'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'
export type KrMetric = 'count' | 'percent' | 'currency' | 'days' | 'ratio'
export type KrStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'partial' | 'missed'
export type KrSource = 'auto_critical6' | 'auto_kpi' | 'manual'
export type KrVisibility = 'company' | 'division' | 'team' | 'cross_team_pinned' | 'private'
export type KrAlignmentType = 'enables' | 'depends_on' | 'parallel_with'
export type ConsumerScope = 'sales-crm' | 'scm-crm' | 'oh-crm' | 'hr-platform' | 'marketing-platform'

export interface Objective {
  id: string
  scope: ObjectiveScope
  ownerId: string
  divisionId?: string
  teamId?: string
  title: string
  description: string
  year: number
  status: ObjectiveStatus
  progress: number
  parentObjectiveId?: string
  consumerScope?: ConsumerScope[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface KeyResult {
  id: string
  objectiveId: string
  title: string
  metric: KrMetric
  baseline?: number
  target: number
  current: number
  unit: string
  quarter: Quarter
  weight: number
  progress: number | null            // BR-OKR-001 — task 0건이면 null
  ownerId: string
  ownerScope?: ConsumerScope
  status: KrStatus
  source: KrSource
  linkedKpiSource?: {
    consumerScope: ConsumerScope
    kpiType: string
    filter?: Record<string, unknown>
  }
  visibility: KrVisibility
  alignedKrIds?: string[]
  lastAutoUpdate?: string
  staleSinceMinutes?: number
  version: number
  createdAt: string
}

export interface StrategicGoal {
  id: string
  parentKrId: string
  month: string
  title: string
  ownerId: string
  consumerScope?: ConsumerScope
  progress: number
  status: 'pending' | 'in_progress' | 'done' | 'missed'
}

export interface KrAlignment {
  id: string
  fromKrId: string
  toKrId: string
  type: KrAlignmentType
  description: string
  createdBy: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface KrContribution {
  id: string
  krId: string
  consumerScope: ConsumerScope
  contributionType: 'critical6_task' | 'activity' | 'kpi_value' | 'manual_update'
  externalId: string
  ownerId: string
  contributionWeight: number
  completionRatio: number
  contributedAt: string
  quarter: Quarter
}

export interface LimitingStepRecommendation {
  krId: string
  title: string
  progress: number
  expectedProgress: number
  delay: string
  recommendedTasks: string[]
  isFallback: boolean
  reason?: string
}

export interface OkrTreeNode {
  type: 'objective' | 'keyresult' | 'goal'
  id: string
  title: string
  progress: number | null
  status: string
  ownerId: string
  ownerName?: string
  weight?: number
  alignedTo?: { krId: string; krTitle: string; type: KrAlignmentType }[]
  children?: OkrTreeNode[]
  contributingTaskIds?: string[]
}

export interface QuarterRetroReport {
  quarter: Quarter
  year: number
  scope: ObjectiveScope
  generatedAt: string
  krResults: Array<{
    krId: string
    title: string
    finalProgress: number | null
    status: KrStatus
    note?: string
  }>
  limitingStepCount: number
  topLimitingKrs: Array<{ krId: string; title: string; count: number }>
  mappingRate: number
  mappingRateImprovement?: number
  alignments: Array<{
    fromKrId: string
    toKrId: string
    type: KrAlignmentType
    effectiveness: 'positive' | 'mixed' | 'negative'
    note: string
  }>
  recommendations: string[]
}
