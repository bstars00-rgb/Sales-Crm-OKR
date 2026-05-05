import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockCalendarEvents } from '@/mocks/calendar'
import { toast } from 'sonner'

type ViewMode = 'monthly' | 'weekly'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const EVENT_PILL_STYLES = {
  travel_mart: 'bg-blue-100 text-blue-700 border-blue-200',
  company: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  holiday: 'bg-red-100 text-red-700 border-red-200',
}

const EVENT_TYPE_LABELS = {
  travel_mart: '전시/박람회',
  company: '사내 일정',
  holiday: '공휴일',
}

const HOLIDAY_COUNTRIES = ['Japan', 'South Korea', 'Thailand', 'India', 'China']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(2) // March = 2 (0-indexed)
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(HOLIDAY_COUNTRIES))

  const monthName = new Date(currentYear, currentMonth).toLocaleString('ko-KR', { year: 'numeric', month: 'long' })

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function toggleCountry(country: string) {
    setSelectedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(country)) {
        next.delete(country)
      } else {
        next.add(country)
      }
      return next
    })
  }

  // Filter events for current month view
  const visibleEvents = useMemo(() => {
    return mockCalendarEvents.filter((evt) => {
      // Filter out holidays from deselected countries
      if (evt.type === 'holiday' && evt.country && !selectedCountries.has(evt.country)) {
        return false
      }

      const start = new Date(evt.date)
      const end = evt.endDate ? new Date(evt.endDate) : start
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0)

      return start <= monthEnd && end >= monthStart
    })
  }, [currentYear, currentMonth, selectedCountries])

  function getEventsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const date = new Date(currentYear, currentMonth, day)

    return visibleEvents.filter((evt) => {
      const start = new Date(evt.date)
      const end = evt.endDate ? new Date(evt.endDate) : start
      return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth

  // Build grid: leading blanks + days
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  // Pad trailing to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">캘린더</h1>
            <p className="text-sm text-muted-foreground">여행 박람회, 사내 일정, 공휴일 관리</p>
          </div>
        </div>
        <button
          onClick={() => toast.info('이벤트 추가 (준비 중)')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          일정 추가
        </button>
      </div>

      {/* Toolbar */}
      <section className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'monthly' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              월간
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'weekly' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              주간
            </button>
          </div>

          {/* Country holiday filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">공휴일 필터:</span>
            {HOLIDAY_COUNTRIES.map((country) => (
              <label key={country} className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCountries.has(country)}
                  onChange={() => toggleCountry(country)}
                  className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5"
                />
                {country}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Month Navigation + Calendar Grid */}
      <section className="bg-white rounded-xl border overflow-hidden">
        {/* Month nav header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold">{monthName}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                'px-2 py-2 text-center text-xs font-medium',
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="min-h-[100px] border-b border-r last:border-r-0 bg-muted/10" />
            }
            const dayEvents = getEventsForDay(day)
            const isToday = isCurrentMonth && today.getDate() === day
            const dayOfWeek = (firstDay + day - 1) % 7

            return (
              <div
                key={day}
                className={cn(
                  'min-h-[100px] border-b border-r p-1.5 transition-colors hover:bg-muted/20',
                  idx % 7 === 6 && 'border-r-0'
                )}
              >
                <div
                  className={cn(
                    'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    isToday && 'bg-blue-600 text-white',
                    !isToday && dayOfWeek === 0 && 'text-red-400',
                    !isToday && dayOfWeek === 6 && 'text-blue-400',
                    !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-foreground'
                  )}
                >
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className={cn(
                        'text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate',
                        EVENT_PILL_STYLES[evt.type],
                        evt.type === 'holiday' ? 'cursor-not-allowed' : 'cursor-grab'
                      )}
                      title={evt.title}
                    >
                      {evt.type !== 'holiday' && <GripVertical className="w-2.5 h-2.5 inline-block mr-0.5 opacity-40" />}
                      {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Legend */}
      <section className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-6 flex-wrap">
          {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-3 h-3 rounded border',
                  EVENT_PILL_STYLES[type as keyof typeof EVENT_PILL_STYLES]
                )}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <GripVertical className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">드래그 가능</span>
          </div>
        </div>
      </section>
    </div>
  )
}
