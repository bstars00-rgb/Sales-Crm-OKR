export const mockTrendData = [
  { month: 'Jan', ota: 42_000, api: 28_000, wholesale: 18_000 },
  { month: 'Feb', ota: 38_000, api: 26_000, wholesale: 16_500 },
  { month: 'Mar', ota: 45_000, api: 30_000, wholesale: 19_000 },
  { month: 'Apr', ota: 50_000, api: 33_000, wholesale: 21_000 },
  { month: 'May', ota: 48_000, api: 32_000, wholesale: 20_500 },
  { month: 'Jun', ota: 52_000, api: 35_000, wholesale: 22_000 },
  { month: 'Jul', ota: 62_000, api: 41_000, wholesale: 26_000 },
  { month: 'Aug', ota: 65_000, api: 43_000, wholesale: 27_500 },
  { month: 'Sep', ota: 55_000, api: 37_000, wholesale: 23_000 },
  { month: 'Oct', ota: 58_000, api: 39_000, wholesale: 24_500 },
  { month: 'Nov', ota: 53_000, api: 36_000, wholesale: 22_500 },
  { month: 'Dec', ota: 60_000, api: 40_000, wholesale: 25_000 },
]

export const mockEvents = [
  { id: 'evt-1', name: 'OTA 프로모션 캠페인 시작', date: '2025-03-15', type: 'promotion' as const, description: '봄 시즌 OTA 파트너 할인 프로모션 개시. 10% 추가 할인 제공.' },
  { id: 'evt-2', name: 'API v2 마이그레이션', date: '2025-05-01', type: 'system' as const, description: 'API v2 전환 완료. 응답 속도 40% 개선, 에러율 감소.' },
  { id: 'evt-3', name: '여름 성수기 돌입', date: '2025-07-01', type: 'market' as const, description: '일본/태국 중심 여름 성수기 시작. 예약 급증 예상.' },
  { id: 'evt-4', name: '추석 연휴 특가', date: '2025-10-01', type: 'promotion' as const, description: '한국 추석 연휴 맞이 특별 프로모션. 한국 출발 상품 집중.' },
  { id: 'evt-5', name: '연말 시스템 업그레이드', date: '2025-12-01', type: 'system' as const, description: '예약 엔진 성능 최적화. 동시 처리 용량 2배 증가.' },
]

export const mockChannelStats = [
  { channel: 'OTA', roomNights: 628_000, share: 48.2, growth: 12.5 },
  { channel: 'API', roomNights: 420_000, share: 32.3, growth: 18.3 },
  { channel: 'Wholesale', roomNights: 255_500, share: 19.5, growth: 6.8 },
]
