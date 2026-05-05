import { Outlet } from 'react-router'
import Header from './Header'
import Sidebar from './Sidebar'
import TabNavigation from './TabNavigation'
import SubNavigation from './SubNavigation'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabNavigation />
          <SubNavigation />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
