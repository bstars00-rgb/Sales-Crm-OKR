import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Bell, ChevronDown, Settings, LogOut, User as UserIcon, Sun, Moon, Monitor, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { mockAlerts } from '@/mocks/alerts'
import NotificationCenter from './NotificationCenter'
import GlobalSearchModal from '@/components/common/GlobalSearchModal'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

export default function Header() {
  const { user, switchRole, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [roleOpen, setRoleOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun

  const unreadCount = useMemo(
    () => mockAlerts.filter(a => a.status === 'created').length,
    []
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cmd+K / Ctrl+K 글로벌 검색 (FR-016)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isFormElement = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !isFormElement) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            OhMyHotel Sales CRM
          </h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Role Switcher */}
          <div ref={roleRef} className="relative">
            <button
              onClick={() => setRoleOpen(!roleOpen)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
                'border border-border hover:bg-accent transition-colors'
              )}
            >
              <span className="text-muted-foreground text-xs">역할:</span>
              <span className="font-medium">{user ? ROLE_LABELS[user.role] : '-'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => { switchRole(role); setRoleOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                      user?.role === role && 'bg-accent font-medium'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Global Search (Cmd+K) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-sm text-muted-foreground"
            title="글로벌 검색 (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">검색</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-mono rounded bg-muted text-muted-foreground/80">⌘K</kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title={`테마: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar + Dropdown */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserOpen(!userOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium max-w-[80px] truncate">
                {user?.name ?? '---'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => setUserOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  설정
                </button>
                <button
                  onClick={() => { logout(); setUserOpen(false); navigate('/login') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Center Panel */}
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Global Search Modal (FR-016 Cmd+K) */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
