import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { FilterProvider } from '@/contexts/FilterContext'
import { ActivityStoreProvider } from '@/contexts/ActivityStore'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/pages/LoginPage'
import DailyBriefingPage from '@/pages/DailyBriefingPage'
import Critical6Page from '@/pages/Critical6Page'
import Critical6TeamPage from '@/pages/Critical6TeamPage'
import OverviewPage from '@/pages/OverviewPage'
import PerformancePage from '@/pages/PerformancePage'
import CRMPage from '@/pages/CRMPage'
import DestinationPage from '@/pages/DestinationPage'
import HotelsPage from '@/pages/HotelsPage'
import TrendsPage from '@/pages/TrendsPage'
import CalendarPage from '@/pages/CalendarPage'
import LiveMapPage from '@/pages/LiveMapPage'
import IntegrationPage from '@/pages/IntegrationPage'
import WeeklyBriefPage from '@/pages/WeeklyBriefPage'
import PipelinePage from '@/pages/PipelinePage'
import ContractsPage from '@/pages/ContractsPage'
import DecisionsPage from '@/pages/DecisionsPage'
import SettingsPage from '@/pages/SettingsPage'
import OpportunitiesPage from '@/pages/OpportunitiesPage'
import ReportsPage from '@/pages/ReportsPage'
import OkrTreePage from '@/pages/OkrTreePage'
import OkrTeamPage from '@/pages/OkrTeamPage'
import OkrBottleneckPage from '@/pages/OkrBottleneckPage'
import OkrRetroPage from '@/pages/OkrRetroPage'
import OnboardingModal from '@/components/common/OnboardingModal'
import { OkrProvider } from '@/contexts/OkrContext'
import { useState, useEffect } from 'react'

function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function ProtectedShell() {
  const { user } = useAuth()
  const [onboardOpen, setOnboardOpen] = useState(false)

  // FR-025 첫 로그인 onboarding 자동 표시
  useEffect(() => {
    if (user && !user.onboardedAt) setOnboardOpen(true)
  }, [user])

  // PL-R3-001: user.id 변경 시 MainLayout key 변경 → 컴포넌트 강제 리마운트
  // (직급 전환 시 이전 사용자 BriefingState 깜빡임 방지)
  return (
    <>
      <MainLayout key={user?.id ?? 'anon'} />
      <OnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ActivityStoreProvider>
          <FilterProvider>
            <OkrProvider>
            <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<ProtectedShell />}>
                  <Route path="/briefing" element={<Critical6Page />} />
                  <Route path="/critical6" element={<Critical6Page />} />
                  <Route path="/critical6/team" element={<Critical6TeamPage />} />
                  <Route path="/briefing-legacy" element={<DailyBriefingPage />} />
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/destination" element={<DestinationPage />} />
                  <Route path="/performance" element={<PerformancePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/hotels" element={<HotelsPage />} />
                  <Route path="/trends" element={<TrendsPage />} />
                  <Route path="/live-map" element={<LiveMapPage />} />
                  <Route path="/crm" element={<CRMPage />} />
                  <Route path="/integration" element={<IntegrationPage />} />
                  <Route path="/pipeline" element={<PipelinePage />} />
                  <Route path="/weekly-brief" element={<WeeklyBriefPage />} />
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route path="/opportunities" element={<OpportunitiesPage />} />
                  <Route path="/decisions" element={<DecisionsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  {/* Round 14 OKR Platform Consumer 통합 */}
                  <Route path="/okr" element={<Navigate to="/okr/my" replace />} />
                  <Route path="/okr/my" element={<OkrTreePage />} />
                  <Route path="/okr/team" element={<OkrTeamPage />} />
                  <Route path="/okr/bottleneck" element={<OkrBottleneckPage />} />
                  <Route path="/okr/retro" element={<OkrRetroPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
            </HashRouter>
            <Toaster position="bottom-right" richColors />
            </OkrProvider>
          </FilterProvider>
        </ActivityStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
