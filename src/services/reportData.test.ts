import { describe, it, expect } from 'vitest'
import { inferChannelId, adaptPipelineStage } from './reportData'

describe('inferChannelId', () => {
  it('Trip.com / Ctrip 매칭', () => {
    expect(inferChannelId('Trip.com Group')).toBe('c2')
    expect(inferChannelId('Ctrip Korea')).toBe('c2')
  })

  it('Agoda / Klook / MakeMyTrip 매칭', () => {
    expect(inferChannelId('Agoda Inc.')).toBe('c-agoda')
    expect(inferChannelId('Klook Travel')).toBe('c-klook')
    expect(inferChannelId('MakeMyTrip Pvt')).toBe('c-mmt')
  })

  it('미매칭은 c-unknown 반환 (QA-009 회귀)', () => {
    expect(inferChannelId('Some Random Channel XYZ')).toBe('c-unknown')
    expect(inferChannelId('Tripadvisor')).toBe('c-tripadvisor') // 별도 매핑
  })

  it('VN: Gotadi 매칭 (QA-009 시나리오)', () => {
    expect(inferChannelId('VN: Gotadi')).toBe('c-gotadi')
  })
})

describe('adaptPipelineStage', () => {
  it('한자 마커 → 영문 단계명', () => {
    expect(adaptPipelineStage('①')).toBe('Contact')
    expect(adaptPipelineStage('②')).toBe('NDA')
    expect(adaptPipelineStage('③')).toBe('InDev')
    expect(adaptPipelineStage('④')).toBe('Testing')
    expect(adaptPipelineStage('⑤')).toBe('Live')
  })

  it('미정의는 Contact fallback', () => {
    expect(adaptPipelineStage('?')).toBe('Contact')
  })
})
