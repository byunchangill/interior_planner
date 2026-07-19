// BottomNav — 하단 탭 네비게이션
// 디자인 원본: docs/_1/code.html BottomNavBar
// 스타일: 흰(surface) 배경, primary 활성 색, Material Symbols 아이콘
import { NavLink } from 'react-router-dom'

interface Tab {
  to: string
  icon: string
  label: string
}

// 하단 탭 5개 — 홈(/), 내 공간(/spaces), 추천(/reco), 보관함(/saved), 마이(/my)
const TABS: Tab[] = [
  { to: '/', icon: 'home', label: '홈' },
  { to: '/spaces', icon: 'chair', label: '내 공간' },
  { to: '/reco', icon: 'auto_awesome', label: '추천' },
  { to: '/saved', icon: 'inventory_2', label: '보관함' },
  { to: '/my', icon: 'person', label: '마이' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant shadow-lg md:max-w-md md:left-1/2 md:-translate-x-1/2 md:rounded-t-2xl">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-transform duration-200',
              isActive
                ? 'bg-primary-container text-on-primary-container scale-95'
                : 'text-on-surface-variant hover:opacity-80',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-label-sm text-[10px]">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
