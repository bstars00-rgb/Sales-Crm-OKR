# OhMyHotel Sales CRM × OKR Platform

Sales CRM with **OMH OKR Platform** consumer integration — Andy Grove "High Output Management" 기반 통합 플랫폼.

이 프로토타입은 기존 Sales CRM에 **회사 전체 공유 OKR Platform** 통합 사례를 시연합니다. 향후 SCM CRM, OH-CRM, HR Platform, Marketing Platform 등 다른 팀 플랫폼이 동일 SDK(`@omh/okr-sdk`)로 OKR Platform을 consume할 수 있도록 설계되었습니다.

## 새로 추가된 기능 (Round 14)

### OKR Platform Consumer 통합

- **`/okr/my`** — 본인 OKR Tree (Annual → KR → Goal → Critical 6 task 4-level drill-down)
- **`/okr/team`** — 팀 KR + Cross-team Alignment + 매핑 heatmap
- **`/okr/bottleneck`** — Bottleneck Chart (Andy Grove 평행 트랙 시각화, Limiting Step 강조)
- **`/okr/retro`** — Quarter Retro Report (분기 회고 자동 생성)

### Critical 6 OKR 통합

- 작성 화면 상단에 **Limiting Step 추천 배너** 노출
- 추천 task 3건 자동 표시 + [추천 적용] / [무시 (24h)] 액션
- KR 매핑된 task 추적 (mock OkrClient.reportContribution 호출)

### Mock OKR Platform

- `src/lib/okr-client.ts` — `OkrClient` mock 구현 (5xx 시뮬레이션 토글 포함)
- `src/mocks/okr.ts` — Annual Objective + Q3 KR 7개 + 50건 contribution + Cross-team Alignment + 분기 회고 리포트
- `src/contexts/OkrContext.tsx` — React Provider (graceful degrade + 캐시 + 24h 무시 정책)

### 핵심 비즈니스 룰 (BR-OKR-001~003 정식 구현)

- **BR-OKR-001 자동 집계 공식**: 가중평균 + division by zero 방어 + 부동소수점 안전 + clamp(0,1)
- **BR-OKR-002 Limiting Step**: cold-start 14일 보호 + 동률 시 weight 우선 + historical 0건 fallback
- **BR-OKR-003 미연결 비율 정책**: 4단계 임계 + 신규 입사자 30일 면제

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8 + TailwindCSS 4
- **Routing**: react-router 7 (HashRouter — GitHub Pages 호환)
- **Charts**: Recharts
- **Icons**: lucide-react
- **Toast**: Sonner

## Core Features (기존 Sales CRM)

- **Critical 6**: 일일 최우선 6개 작업 등록 (PRD v1.2 — OKR Platform consumer 통합)
- **Activity Timeline**: 채널별 모든 접점 (이메일/콜/미팅/계약) 시간순
- **Daily Briefing**: 퇴근 전 자동 집계
- **KPI Cascade**: 전사 → 권역 → 채널 → 팀원 → 월별 5단계 자동 배분
- **Pipeline 5단계**: Contact → NDA → InDev → Testing → Live + SLA 모니터링
- **Opportunity / Win-Loss / Forecast**: Salesforce 패턴
- **Pipeline Kanban Drag-drop**: HTML5 native, 6 컬럼 stage 전이
- **Ctrip / China 의존도**: ≤35% / ≤65% CEO OKR 자동 추적
- **다국어**: KR / EN / VI
- **다크/라이트 테마**

## 로컬 개발

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 빌드

```bash
npm run build
npm run preview
```

## 디렉토리 구조

```
src/
├── App.tsx                 # HashRouter + Routes (OKR 4 routes 추가)
├── pages/
│   ├── Critical6Page.tsx   # OKR Limiting Step 배너 통합
│   ├── OkrTreePage.tsx     # /okr/my — 본인 OKR Tree (Round 14)
│   ├── OkrTeamPage.tsx     # /okr/team — 팀 OKR + Alignment (Round 14)
│   ├── OkrBottleneckPage.tsx # /okr/bottleneck — 평행 트랙 차트 (Round 14)
│   ├── OkrRetroPage.tsx    # /okr/retro — 분기 회고 (Round 14)
│   └── ... (기존 Sales CRM 페이지)
├── contexts/
│   ├── OkrContext.tsx      # OKR Platform SDK Provider (Round 14)
│   ├── AuthContext.tsx
│   ├── FilterContext.tsx
│   └── ActivityStore.tsx
├── lib/
│   └── okr-client.ts       # mock OkrClient (Round 14)
├── mocks/
│   ├── okr.ts              # OKR Platform mock 데이터 (Round 14)
│   ├── critical6.ts
│   └── ... (기존 mocks)
├── types/
│   └── index.ts            # OKR 엔티티 타입 추가 (Round 14)
└── components/
    └── layout/
        ├── TabNavigation.tsx     # OKR 메인 탭 추가
        └── SubNavigation.tsx     # OKR sub-tab 4개
```

## 스펙 문서

- **OKR Platform PRD**: `../../docs/specs/okr-platform/ko/okr-platform-prd.md`
- **OKR Platform Implementation Plan**: `../../docs/specs/okr-platform/ko/okr-platform-implementation-plan.md`
- **Critical 6 PRD v1.2**: `../../docs/specs/critical-6/ko/critical-6-prd.md` (Section 14 OKR consumer 인터페이스)
- **Sales CRM Spec**: `../../docs/specs/sales-crm/ko/sales-crm-spec.md` (FR-033/034/035)
- **Integrated Platform Guide v2.0**: `../../docs/specs/integrated-platform/ko/integrated-platform-prd.md`

## Mock OKR Platform 시뮬레이션 토글

OKR Platform 5xx 응답 시 graceful degrade 동작 검증:

```typescript
import { setOkrPlatformOutage } from '@/lib/okr-client'

// 5xx 시뮬레이션 시작
setOkrPlatformOutage(true)

// → KR dropdown 빈 상태, Limiting Step 배너 미표시,
//    "OKR 시스템 일시 미연결" 배너 표시
//    Critical 6 작성은 정상 동작 (큐잉)

// 정상 복구
setOkrPlatformOutage(false)
```

## Round 14 변경 사항 요약

기존 Sales CRM (https://github.com/bstars00-rgb/Sales-CRM) 코드 + OKR 통합:

- **+8 신규 파일**: 4 OKR 페이지 + OkrContext + okr-client + mocks/okr + types 확장
- **+2 수정**: TabNavigation/SubNavigation (OKR 메뉴), Critical6Page (Limiting Step 배너), App.tsx (라우트)
- **0 breaking change**: 기존 11개 페이지 + Critical 6 모두 정상 동작
