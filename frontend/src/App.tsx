// 앱 셸 레이아웃 — 콘텐츠(Outlet) + 하단 탭(BottomNav)
import { Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background text-on-surface">
      {/* 하단 탭 높이만큼 여백 확보 */}
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
