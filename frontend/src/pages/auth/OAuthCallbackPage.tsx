// 소셜 로그인 콜백 — 카카오/구글이 ?code=로 리다이렉트하는 경로.
// 인가 코드를 백엔드로 전달해 accessToken을 발급받고 홈으로 이동한다.
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { socialLogin } from '../../api/auth'

// 인가 코드는 1회용이라 이미 처리한 코드는 다시 보내면 안 된다. React 18 StrictMode(dev)는
// 컴포넌트를 mount→unmount→remount 하며 effect를 두 번 실행하는데, useRef는 인스턴스별이라
// 리마운트 시 리셋되어 가드가 무력화된다 — 모듈 스코프에 둬야 리마운트를 넘어 가드가 유지된다.
const processedCodes = new Set<string>()

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if ((provider !== 'kakao' && provider !== 'google') || !code) {
      setFailed(true)
      return
    }
    if (processedCodes.has(code)) return
    processedCodes.add(code)

    socialLogin(provider, code)
      .then(() => navigate('/home', { replace: true }))
      .catch(() => setFailed(true))
  }, [provider, searchParams, navigate])

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-margin-mobile text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          소셜 로그인에 실패했습니다.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="font-label-md text-label-md text-primary underline-offset-4 hover:underline"
        >
          로그인 화면으로 돌아가기
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface">
      <p className="font-body-md text-body-md text-on-surface-variant">로그인 처리 중...</p>
    </main>
  )
}
