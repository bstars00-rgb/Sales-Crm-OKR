import type { Task } from '@/types'

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)

// 오늘의 Critical 6 (Ben 기준 시드)
export const mockTasks: Task[] = [
  {
    id: 't-1',
    ownerUserId: 'u-tm',
    date: today,
    rank: 1,
    channelId: 'c2', // Trip.com
    category: 'Promotion',
    title: 'Trip.com Q2 프로모션 협의',
    expectedOutcome: '프로모션 기간 + 예산 합의',
    status: 'InProgress',
    createdAt: `${today}T09:05:00Z`,
    updatedAt: `${today}T09:05:00Z`,
  },
  {
    id: 't-2',
    ownerUserId: 'u-tm',
    date: today,
    rank: 2,
    channelId: 'c1', // HanaTour Japan
    category: 'Issue',
    title: '신용 한도 경고 — Trip.com 96%',
    expectedOutcome: '재무팀 한도 증액 요청서 제출',
    status: 'Planned',
    createdAt: `${today}T09:05:00Z`,
    updatedAt: `${today}T09:05:00Z`,
  },
  {
    id: 't-3',
    ownerUserId: 'u-tm',
    date: today,
    rank: 3,
    channelId: 'c-klook',
    category: 'Pipeline',
    title: 'Klook API sandbox 연동 점검',
    expectedOutcome: 'Testing 단계 진입 여부 확정',
    status: 'Done',
    doneAt: `${today}T11:30:00Z`,
    createdAt: `${today}T09:05:00Z`,
    updatedAt: `${today}T11:30:00Z`,
  },
  {
    id: 't-4',
    ownerUserId: 'u-tm',
    date: today,
    rank: 4,
    category: 'Internal',
    title: 'Q3 KPI 목표 내부 리뷰 준비',
    expectedOutcome: '슬라이드 초안',
    status: 'Planned',
    createdAt: `${today}T09:05:00Z`,
    updatedAt: `${today}T09:05:00Z`,
  },
  {
    id: 't-5',
    ownerUserId: 'u-tm',
    date: today,
    rank: 5,
    channelId: 'c-mmt',
    category: 'Follow-up',
    title: 'MakeMyTrip 미수금 follow-up',
    status: 'Planned',
    carryOver: true,
    createdAt: `${yesterday}T09:05:00Z`,
    updatedAt: `${today}T09:00:00Z`,
  },
]
