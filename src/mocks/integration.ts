export interface Project {
  id: string
  name: string
  client: string
  status: 'Planning' | 'In Progress' | 'Testing' | 'Complete'
  assignee: string
  startDate: string
  endDate: string
  progress: number
  milestones: { name: string; date: string; done: boolean }[]
}

export interface WorkloadEntry {
  assignee: string
  projectCount: number
  conflicts: number
}

export const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Trip.com API v3 연동',
    client: 'Trip.com',
    status: 'In Progress',
    assignee: '김철수',
    startDate: '2026-01-15',
    endDate: '2026-05-30',
    progress: 62,
    milestones: [
      { name: 'API 설계 완료', date: '2026-02-01', done: true },
      { name: '개발 완료', date: '2026-04-15', done: false },
      { name: 'UAT 테스트', date: '2026-05-10', done: false },
      { name: '프로덕션 배포', date: '2026-05-30', done: false },
    ],
  },
  {
    id: 'PRJ-002',
    name: 'Agoda Channel Manager 업그레이드',
    client: 'Agoda',
    status: 'Testing',
    assignee: '이영희',
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    progress: 85,
    milestones: [
      { name: '요구사항 확정', date: '2026-02-15', done: true },
      { name: '채널 매핑 완료', date: '2026-03-10', done: true },
      { name: 'QA 테스트', date: '2026-04-10', done: false },
      { name: '배포', date: '2026-04-30', done: false },
    ],
  },
  {
    id: 'PRJ-003',
    name: 'Expedia Rapid API 마이그레이션',
    client: 'Expedia',
    status: 'Planning',
    assignee: '박민수',
    startDate: '2026-04-01',
    endDate: '2026-08-31',
    progress: 10,
    milestones: [
      { name: '기술 검토', date: '2026-04-15', done: false },
      { name: 'POC 개발', date: '2026-05-30', done: false },
      { name: '본개발', date: '2026-07-15', done: false },
      { name: '런칭', date: '2026-08-31', done: false },
    ],
  },
  {
    id: 'PRJ-004',
    name: 'Booking.com 실시간 재고 연동',
    client: 'Booking.com',
    status: 'In Progress',
    assignee: '김철수',
    startDate: '2026-03-01',
    endDate: '2026-07-15',
    progress: 35,
    milestones: [
      { name: 'API 분석', date: '2026-03-15', done: true },
      { name: '재고 동기화 모듈', date: '2026-05-01', done: false },
      { name: '통합 테스트', date: '2026-06-15', done: false },
      { name: '운영 이관', date: '2026-07-15', done: false },
    ],
  },
  {
    id: 'PRJ-005',
    name: 'Hotelbeds B2B 결제 시스템',
    client: 'Hotelbeds',
    status: 'In Progress',
    assignee: '정수진',
    startDate: '2026-02-15',
    endDate: '2026-06-30',
    progress: 55,
    milestones: [
      { name: '결제 플로우 설계', date: '2026-03-01', done: true },
      { name: 'PG 연동', date: '2026-04-15', done: true },
      { name: '정산 모듈', date: '2026-05-30', done: false },
      { name: '보안 감사', date: '2026-06-30', done: false },
    ],
  },
  {
    id: 'PRJ-006',
    name: 'Rakuten Travel 파트너 포털',
    client: 'Rakuten',
    status: 'Complete',
    assignee: '이영희',
    startDate: '2025-10-01',
    endDate: '2026-02-28',
    progress: 100,
    milestones: [
      { name: '포털 UI 개발', date: '2025-11-15', done: true },
      { name: 'API 연동', date: '2026-01-10', done: true },
      { name: '파트너 테스트', date: '2026-02-10', done: true },
      { name: '오픈', date: '2026-02-28', done: true },
    ],
  },
  {
    id: 'PRJ-007',
    name: 'Klook 액티비티 상품 연동',
    client: 'Klook',
    status: 'In Progress',
    assignee: '김철수',
    startDate: '2026-03-15',
    endDate: '2026-06-30',
    progress: 25,
    milestones: [
      { name: '상품 카탈로그 매핑', date: '2026-04-01', done: false },
      { name: '예약 API 개발', date: '2026-05-15', done: false },
      { name: '테스트', date: '2026-06-15', done: false },
      { name: '런칭', date: '2026-06-30', done: false },
    ],
  },
  {
    id: 'PRJ-008',
    name: 'Ctrip 글로벌 GDS 통합',
    client: 'Ctrip',
    status: 'Planning',
    assignee: '박민수',
    startDate: '2026-05-01',
    endDate: '2026-10-31',
    progress: 5,
    milestones: [
      { name: 'GDS 프로토콜 분석', date: '2026-05-15', done: false },
      { name: '아키텍처 설계', date: '2026-06-30', done: false },
      { name: '코어 개발', date: '2026-09-15', done: false },
      { name: '통합 테스트 및 배포', date: '2026-10-31', done: false },
    ],
  },
]

export const mockWorkload: WorkloadEntry[] = [
  { assignee: '김철수', projectCount: 3, conflicts: 2 },
  { assignee: '이영희', projectCount: 2, conflicts: 0 },
  { assignee: '박민수', projectCount: 2, conflicts: 1 },
  { assignee: '정수진', projectCount: 1, conflicts: 0 },
]
