import type { ContractChange } from '@/types'

// FR-009: 25건 진행률 (17건 Settlement-Change + 8건 SG-Flip)
// Citi Bank 변경 = ⭐ 강조
export const mockContractChanges: ContractChange[] = [
  // ===== Settlement-Change (17건) =====
  { id: 'cc-001', channelId: 'c1', type: 'Settlement-Change', oldValue: 'JPY → KRW', newValue: 'JPY → JPY', contractDate: '2026-03-15', followUpDate: '2026-04-15', completedDate: '2026-04-12', citiBankRef: 'CITI-2026-Q1-001', status: 'Completed', ownerUserId: 'u-tm', notes: '월 정산일 25일 → 28일 변경' },
  { id: 'cc-002', channelId: 'c2', type: 'Settlement-Change', oldValue: 'Net30', newValue: 'Net15', contractDate: '2026-03-22', followUpDate: '2026-04-22', completedDate: '2026-04-18', status: 'Completed', ownerUserId: 'u-tm' },
  { id: 'cc-003', channelId: 'c3', type: 'Settlement-Change', oldValue: 'USD', newValue: 'JPY', contractDate: '2026-04-01', followUpDate: '2026-04-25', citiBankRef: 'CITI-2026-Q2-002', status: 'InProgress', ownerUserId: 'u-grace', notes: 'Citi Bank 환전 계좌 신규 개설' },
  { id: 'cc-004', channelId: 'c4', type: 'Settlement-Change', oldValue: 'KRW', newValue: 'KRW', contractDate: '2026-04-03', followUpDate: '2026-04-28', completedDate: '2026-04-20', status: 'Completed', ownerUserId: 'u-jane' },
  { id: 'cc-005', channelId: 'c5', type: 'Settlement-Change', oldValue: 'Monthly', newValue: 'Bi-weekly', contractDate: '2026-04-05', followUpDate: '2026-04-30', status: 'InProgress', ownerUserId: 'u-jasmine' },
  { id: 'cc-006', channelId: 'c6', type: 'Settlement-Change', oldValue: 'Net45', newValue: 'Net30', contractDate: '2026-04-08', followUpDate: '2026-05-08', completedDate: '2026-04-22', status: 'Completed', ownerUserId: 'u-tm' },
  { id: 'cc-007', channelId: 'c7', type: 'Settlement-Change', oldValue: 'JPY', newValue: 'JPY', contractDate: '2026-04-10', followUpDate: '2026-05-10', status: 'Pending', ownerUserId: 'u-grace', notes: '거래처 내부 검토 대기' },
  { id: 'cc-008', channelId: 'c8', type: 'Settlement-Change', oldValue: 'USD', newValue: 'JPY', contractDate: '2026-04-12', followUpDate: '2026-05-12', citiBankRef: 'CITI-2026-Q2-003', status: 'InProgress', ownerUserId: 'u-jane' },
  { id: 'cc-009', channelId: 'c9', type: 'Settlement-Change', oldValue: 'KRW', newValue: 'KRW', contractDate: '2026-04-15', followUpDate: '2026-05-15', status: 'Pending', ownerUserId: 'u-jasmine' },
  { id: 'cc-010', channelId: 'c10', type: 'Settlement-Change', oldValue: 'Net30', newValue: 'Net21', contractDate: '2026-04-18', followUpDate: '2026-05-18', status: 'InProgress', ownerUserId: 'u-tm' },
  { id: 'cc-011', channelId: 'c11', type: 'Renewal', contractDate: '2026-04-20', followUpDate: '2026-05-20', completedDate: '2026-04-23', status: 'Completed', ownerUserId: 'u-grace', notes: '연간 계약 갱신' },
  { id: 'cc-012', channelId: 'c12', type: 'Renewal', contractDate: '2026-04-21', followUpDate: '2026-05-21', status: 'InProgress', ownerUserId: 'u-jane' },
  { id: 'cc-013', channelId: 'c13', type: 'CreditLimit-Change', oldValue: '¥50M', newValue: '¥80M', contractDate: '2026-04-22', followUpDate: '2026-05-22', citiBankRef: 'CITI-2026-Q2-004', status: 'InProgress', ownerUserId: 'u-jasmine', notes: 'Citi Bank 한도 증액 신청' },
  { id: 'cc-014', channelId: 'c14', type: 'CreditLimit-Change', oldValue: '¥30M', newValue: '¥50M', contractDate: '2026-04-23', followUpDate: '2026-05-23', completedDate: '2026-04-24', status: 'Completed', ownerUserId: 'u-tm' },
  { id: 'cc-015', channelId: 'c15', type: 'Renewal', contractDate: '2026-04-24', followUpDate: '2026-05-24', status: 'Pending', ownerUserId: 'u-grace' },
  { id: 'cc-016', channelId: 'c16', type: 'Settlement-Change', oldValue: 'Bi-weekly', newValue: 'Weekly', contractDate: '2026-04-25', followUpDate: '2026-05-25', status: 'Pending', ownerUserId: 'u-jane' },
  { id: 'cc-017', channelId: 'c17', type: 'Settlement-Change', oldValue: 'JPY', newValue: 'KRW', contractDate: '2026-04-25', followUpDate: '2026-05-25', citiBankRef: 'CITI-2026-Q2-005', status: 'Rejected', ownerUserId: 'u-jasmine', rejectionReason: '거래처 환차익 부담 거부' },

  // ===== SG-Flip (8건) — 싱가포르 법인 → 거래선 환경 변경 =====
  { id: 'sg-001', channelId: 'c18', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-03-10', followUpDate: '2026-04-10', completedDate: '2026-04-05', citiBankRef: 'CITI-SG-2026-001', status: 'Completed', ownerUserId: 'u-dir', notes: '싱가포르 법인 전환 완료' },
  { id: 'sg-002', channelId: 'c19', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-03-20', followUpDate: '2026-04-20', completedDate: '2026-04-15', citiBankRef: 'CITI-SG-2026-002', status: 'Completed', ownerUserId: 'u-dir' },
  { id: 'sg-003', channelId: 'c20', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-01', followUpDate: '2026-04-30', citiBankRef: 'CITI-SG-2026-003', status: 'InProgress', ownerUserId: 'u-tmgr', notes: '계약서 검토 단계' },
  { id: 'sg-004', channelId: 'c21', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-08', followUpDate: '2026-05-08', citiBankRef: 'CITI-SG-2026-004', status: 'InProgress', ownerUserId: 'u-tmgr' },
  { id: 'sg-005', channelId: 'c22', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-15', followUpDate: '2026-05-15', citiBankRef: 'CITI-SG-2026-005', status: 'Pending', ownerUserId: 'u-dir' },
  { id: 'sg-006', channelId: 'c23', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-18', followUpDate: '2026-05-18', citiBankRef: 'CITI-SG-2026-006', status: 'Pending', ownerUserId: 'u-tmgr' },
  { id: 'sg-007', channelId: 'c24', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-22', followUpDate: '2026-05-22', citiBankRef: 'CITI-SG-2026-007', status: 'InProgress', ownerUserId: 'u-dir', notes: 'Citi Bank 계좌 신규 개설 중' },
  { id: 'sg-008', channelId: 'c25', type: 'SG-Flip', oldValue: 'OhMyHotel KR', newValue: 'OhMyHotel SG', contractDate: '2026-04-24', followUpDate: '2026-05-24', citiBankRef: 'CITI-SG-2026-008', status: 'Pending', ownerUserId: 'u-tmgr', notes: '거래처 통보 대기' },
]

export function contractChangeStats(items: ContractChange[] = mockContractChanges) {
  const total = items.length
  const completed = items.filter((c) => c.status === 'Completed').length
  const inProgress = items.filter((c) => c.status === 'InProgress').length
  const pending = items.filter((c) => c.status === 'Pending').length
  const rejected = items.filter((c) => c.status === 'Rejected').length
  const completionRate = total > 0 ? completed / total : 0
  return { total, completed, inProgress, pending, rejected, completionRate }
}
