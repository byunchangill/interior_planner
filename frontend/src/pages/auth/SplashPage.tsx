// COM-001 스플래시 — docs/_27
// 앱 시작 진입점. accessToken 있으면 GET /auth/me로 세션 확인 → 홈으로,
// 실패 시 client 인터셉터가 refresh 시도 후 실패하면 /login으로 리다이렉트.
// 토큰이 아예 없으면(첫 방문) 온보딩으로.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { getAccessToken } from '../../api/tokens'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    async function check() {
      if (!getAccessToken()) {
        navigate('/onboarding', { replace: true })
        return
      }
      try {
        await getMe()
        if (alive) navigate('/home', { replace: true })
      } catch {
        // 401 → 인터셉터가 refresh 재시도. 성공 시 getMe가 통과되어 위에서 홈 이동.
        // refresh까지 실패하면 인터셉터가 window.location으로 /login 이동시킴.
      }
    }
    check()
    return () => {
      alive = false
    }
  }, [navigate])

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-surface p-margin-mobile">
      <div className="absolute right-[-10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-primary opacity-5 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-secondary opacity-10 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-stack-lg">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] bg-surface-container-lowest/70 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <span
            className="material-symbols-outlined text-[64px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home_app_logo
          </span>
          <div className="absolute -right-2 -top-2 rounded-full bg-secondary-container px-3 py-1 font-label-md text-label-md text-on-secondary-container shadow-sm">
            AI
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="mb-stack-sm font-headline-xl text-headline-xl tracking-tighter text-primary">
            HomeStyler
          </h1>
          <p className="font-body-lg text-body-lg tracking-wide text-on-surface-variant/80">
            AI로 완성하는 나만의 공간
          </p>
        </div>
      </div>

      <div className="absolute bottom-16 flex w-full max-w-[240px] flex-col items-center gap-stack-md">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full animate-pulse bg-primary" style={{ width: '70%' }} />
        </div>
        <span className="animate-pulse font-label-sm text-label-sm text-outline">
          공간을 디자인하는 중...
        </span>
      </div>
    </main>
  )
}
