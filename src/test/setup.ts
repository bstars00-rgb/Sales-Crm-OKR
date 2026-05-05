import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom 환경에서 fetch가 없거나 public/data를 못 읽으므로 mock
// (KPICascadeCard, OverviewPage, WeeklyBriefPage, PipelinePage 등 loadReport 사용)
if (typeof globalThis.fetch === 'undefined' || true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    } as Response)
  )
}
