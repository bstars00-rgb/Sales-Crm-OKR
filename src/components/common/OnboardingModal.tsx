import { useState } from 'react'
import { X, Check, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, type LangCode } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

const STEPS = ['프로필 확인', '언어 선택', '알림 카테고리', 'Critical 6 가이드'] as const

export default function OnboardingModal({ open, onClose }: Props) {
  const { user, setOnboarded } = useAuth()
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<LangCode>(user?.language ?? 'ko')

  if (!open || !user) return null

  const finish = () => {
    setOnboarded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="relative w-full max-w-[720px] mx-4 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Sales CRM에 오신 것을 환영합니다</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.name}님, {ROLE_LABELS[user.role]} 권한으로 진입하셨습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            title="건너뛰기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 mt-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold',
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs hidden sm:inline',
                  i === step ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">프로필 확인</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="이름" value={user.name} />
                <Field label="이메일" value={user.email} />
                <Field label="직급" value={ROLE_LABELS[user.role]} />
                <Field label="권역" value={user.region ?? '—'} />
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                정보가 잘못된 경우 IT팀에 문의하세요. (Azure AD 그룹 매핑 기준)
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">사용 언어 선택</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['ko', 'en', 'vi'] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-all',
                      language === code
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-foreground/30'
                    )}
                  >
                    <div className="text-2xl mb-1">
                      {code === 'ko' ? '🇰🇷' : code === 'en' ? '🇺🇸' : '🇻🇳'}
                    </div>
                    <div className="font-medium text-sm">
                      {code === 'ko' ? '한국어' : code === 'en' ? 'English' : 'Tiếng Việt'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">알림 수신 설정</h3>
              <p className="text-xs text-muted-foreground">
                기본값은 모든 카테고리 ON. 나중에 Settings에서 변경 가능합니다.
              </p>
              <div className="space-y-2">
                {[
                  ['크레딧/계약', '결제기한, 크레딧 한도, 계약 만료'],
                  ['예약/실적', '예약 급증/급감, 취소율'],
                  ['파이프라인', '단계 전이, SLA 위반'],
                  ['OKR/전략', 'Ctrip ≤35%, China ≤65%'],
                  ['Critical 6 / Task', '일일 작업 알림'],
                ].map(([title, desc]) => (
                  <label
                    key={title}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                  >
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                ⚠️ Critical 알림은 설정과 무관하게 항상 발송됩니다.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Critical 6 사용 가이드</h3>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
                <p>
                  <strong>매일 출근 직후</strong> 오늘의 최우선 작업 <strong>6개</strong>를 등록하세요.
                </p>
                <p className="text-muted-foreground">
                  Daily Briefing 페이지에서 Cmd+N (또는 + 추가 버튼) 으로 등록할 수 있습니다.
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pt-2">
                  <li>각 Task에 카테고리 (NewDeal / Promotion / Issue / Contract / Pipeline / Internal / Follow-up) 부여</li>
                  <li>완료 체크 시 Activity 자동 생성 → 주간보고에 자동 반영</li>
                  <li>미완료 Task는 다음날로 이월 (carry-over)</li>
                  <li>퇴근 전 Daily Briefing 마감 → 5일치 → 토요일 Weekly Sales Brief 자동 생성</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 일을 두 번 입력하지 마세요. 한 번 등록 → 자동 집계.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => {
              setOnboarded()
              onClose()
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            건너뛰기
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent"
              >
                이전
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center gap-1"
              >
                다음
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                시작하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}
