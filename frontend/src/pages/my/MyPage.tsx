// MY-001 마이페이지 — docs/_8 ("My Page" 한글판)
// GET /me/profile: 프로필(닉네임/이메일) + 통계(공간/저장추천/사진) + 설정·데이터관리·탈퇴 진입 + 로그아웃
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../../api/my'
import { logout } from '../../api/auth'
import { useFetch } from '../../hooks/useFetch'
import type { ProfileStats } from '../../types/my'

interface MenuItem {
  icon: string
  label: string
  desc?: string
  to: string
  danger?: boolean
}

const MENU: MenuItem[] = [
  { icon: 'person_edit', label: '계정 설정', desc: '닉네임·마케팅 수신 동의', to: '/my/account' },
  { icon: 'shield_person', label: '데이터·개인정보 관리', desc: '원본 사진·도면 삭제', to: '/my/data' },
  { icon: 'support_agent', label: '공지·고객센터', desc: '공지사항 및 자주 묻는 질문', to: '/my/support' },
  { icon: 'no_accounts', label: '회원 탈퇴', desc: '계정 및 모든 데이터 삭제', to: '/my/withdraw', danger: true },
]

const STAT_CARDS: { key: keyof ProfileStats; icon: string; label: string; tone: string }[] = [
  { key: 'spaceCount', icon: 'chair', label: '내 공간', tone: 'text-primary bg-primary/10' },
  { key: 'savedRecommendationCount', icon: 'inventory_2', label: '저장한 추천', tone: 'text-secondary bg-secondary/10' },
  { key: 'photoCount', icon: 'image', label: '업로드 사진', tone: 'text-tertiary bg-tertiary/10' },
]

export default function MyPage() {
  const navigate = useNavigate()
  const res = useFetch(getProfile)

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">마이페이지</h1>
        <button className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-low">
          notifications
        </button>
      </header>

      <main className="px-margin-mobile pt-6">
        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="mt-6 rounded-xl bg-error-container p-stack-md text-on-error-container">
            <p className="font-label-md text-label-md">프로필을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <>
            {/* 프로필 카드 */}
            <section className="mb-stack-lg">
              <div className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-md shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_circle
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-headline-md text-headline-md text-on-surface">
                    {res.data.nickname}님
                  </h2>
                  <p className="mt-1 truncate font-body-sm text-body-sm text-on-surface-variant">
                    {res.data.email}
                  </p>
                </div>
              </div>
            </section>

            {/* 활동 요약 (통계 3종) */}
            <section className="mb-stack-lg grid grid-cols-3 gap-3">
              {STAT_CARDS.map((c) => (
                <div
                  key={c.key}
                  className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${c.tone}`}>
                    <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                  </div>
                  <div>
                    <span className="block font-headline-md text-headline-md text-on-surface">
                      {res.data.stats[c.key]}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{c.label}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* 설정 및 관리 메뉴 */}
            <section className="space-y-2">
              <h4 className="mb-2 px-2 font-label-md text-label-md text-on-surface-variant">설정 및 관리</h4>
              {MENU.map((m) => (
                <button
                  key={m.to}
                  onClick={() => navigate(m.to)}
                  className="group flex w-full items-center justify-between rounded-xl bg-surface-container-low p-4 text-left transition-all hover:bg-surface-container-high active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface transition-colors ${
                        m.danger ? 'text-error' : 'text-on-surface-variant group-hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined">{m.icon}</span>
                    </div>
                    <div>
                      <span className={`block font-body-md text-body-md ${m.danger ? 'text-error' : 'text-on-surface'}`}>
                        {m.label}
                      </span>
                      {m.desc && (
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{m.desc}</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
                </button>
              ))}
            </section>

            {/* 로그아웃 */}
            <div className="py-stack-lg text-center">
              <button
                onClick={onLogout}
                className="font-label-md text-label-md text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors hover:text-error"
              >
                로그아웃
              </button>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-outline">HomeStyler v1.0</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
