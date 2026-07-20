// COM-003 로그인 — docs/_21
// 이메일 로그인 폼 + 소셜 로그인 버튼(클릭 시 "준비 중" 토스트, API 없음).
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../api/auth'
import Toast from '../../components/Toast'

interface Social {
  id: string
  label: string
  className: string
  icon?: string
  iconChar?: string
}

const SOCIALS: Social[] = [
  { id: 'kakao', label: '카카오로 시작하기', className: 'bg-[#FEE500] text-[#191919]', icon: 'chat_bubble' },
  { id: 'naver', label: '네이버로 시작하기', className: 'bg-[#03C75A] text-white', iconChar: 'N' },
  { id: 'apple', label: 'Apple로 시작하기', className: 'bg-black text-white', icon: 'apple' },
  {
    id: 'google',
    label: 'Google로 시작하기',
    className: 'bg-white border border-outline-variant text-on-surface',
    icon: 'g_translate',
  },
]

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
                {s.icon ? (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {s.icon}
                  </span>
                ) : (
                  <span className="font-bold">{s.iconChar}</span>
                )}
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
