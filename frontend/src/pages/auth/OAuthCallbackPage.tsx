// 소셜 로그인 콜백 — 카카오/구글이 ?code=로 리다이렉트하는 경로.
// 인가 코드를 백엔드로 전달해 accessToken을 발급받고 홈으로 이동한다.
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { socialLogin } from '../../api/auth'

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = searchParams.get('code')
    if ((provider !== 'kakao' && provider !== 'google') || !code) {
      setFailed(true)
      return
    }
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
