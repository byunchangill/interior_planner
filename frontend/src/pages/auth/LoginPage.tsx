// COM-003 로그인 — docs/_21
// 이메일 로그인 폼 + 소셜 로그인 버튼(클릭 시 "준비 중" 토스트, API 없음).
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../api/auth'
import Toast from '../../components/Toast'

interface Social {
  id: 'kakao' | 'google'
  label: string
  className: string
}

const SOCIALS: Social[] = [
  { id: 'kakao', label: '카카오로 시작하기', className: 'bg-[#FEE500] text-[#191919]' },
  { id: 'google', label: 'Google로 시작하기', className: 'bg-white border border-outline-variant text-on-surface' },
]

// 브랜드 로고 — Material Symbols엔 브랜드 마크가 없어 인라인 SVG로 통일(apple/google 깨짐·오류 해결).
function SocialLogo({ id }: { id: Social['id'] }) {
  const c = 'h-5 w-5'
  switch (id) {
    case 'kakao':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={c} aria-hidden>
          <path d="M12 3C6.48 3 2 6.53 2 10.88c0 2.8 1.9 5.26 4.75 6.63-.16.56-.72 2.5-.75 2.66 0 0-.03.13.06.18a.24.24 0 0 0 .2 0c.24-.03 2.76-1.85 3.2-2.16.44.06.88.09 1.34.09 5.52 0 10-3.53 10-7.88S17.52 3 12 3z" />
        </svg>
      )
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path fill="#4285F4" d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.95 3.44-8.57z" />
          <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.6-2.78l-3.72-2.9c-1.03.7-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.99A11.99 11.99 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.6 14.7A7.2 7.2 0 0 1 5.22 12c0-.94.16-1.85.38-2.7V6.31H1.76A12 12 0 0 0 .5 12c0 1.94.46 3.77 1.26 5.69l3.84-2.99z" />
          <path fill="#EA4335" d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.29-3.29C17.7 1.24 15.1 0 12 0 7.4 0 3.43 2.65 1.76 6.31L5.6 9.3C6.5 6.59 9.02 4.75 12 4.75z" />
        </svg>
      )
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setToast('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate('/home', { replace: true })
    } catch {
      setToast('이메일 또는 비밀번호가 일치하지 않습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-surface px-margin-mobile py-stack-lg">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 font-headline-md text-headline-md font-bold text-primary">
            HomeStyler
          </div>
          <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            반가워요!
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            로그인하고 서비스를 시작하세요.
          </p>
        </div>

        {/* 이메일 로그인 폼 */}
        <form className="mb-8 space-y-3" onSubmit={onSubmit}>
          <input
            type="email"
            autoComplete="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-5 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-5 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-14 w-full rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-lg transition-all active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
          >
            {submitting ? '로그인 중...' : '이메일로 로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="font-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            또는
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        {/* 소셜 로그인 (준비 중) */}
        <div className="space-y-3">
          {SOCIALS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setToast('소셜 로그인은 준비 중입니다.')}
              className={`flex h-[56px] w-full items-center rounded-xl px-6 font-label-md transition-all active:scale-[0.98] ${s.className}`}
            >
              <span className="mr-auto flex w-6 justify-center">
                <SocialLogo id={s.id} />
              </span>
              <span className="flex-grow text-center">{s.label}</span>
              <span className="w-6" />
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            아직 회원이 아니신가요?{' '}
          </span>
          <Link
            to="/signup"
            className="font-label-md text-label-md text-primary underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  )
}
