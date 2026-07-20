// COM-004 회원가입·약관 동의 — docs/_20
// 이메일/비밀번호/닉네임 입력 + 필수/선택 동의 → POST /auth/signup 원스텝 가입.
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'
import type { Consents } from '../../types/auth'
import Toast from '../../components/Toast'

interface ConsentItem {
  key: keyof Consents
  label: string
  required: boolean
  hint?: string
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'imageProcessing',
    label: '[필수] 이미지 데이터 처리 및 AI 학습 활용 동의',
    required: true,
    hint: '업로드한 공간 사진을 분석해 맞춤 스타일을 제안하며, 생성 데이터는 익명화 후 AI 모델 고도화에 활용됩니다.',
  },
  { key: 'termsOfService', label: '[필수] 서비스 이용약관 동의', required: true },
  { key: 'privacyPolicy', label: '[필수] 개인정보 수집 및 이용 동의', required: true },
  { key: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PW_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [consents, setConsents] = useState<Consents>({
    termsOfService: false,
    privacyPolicy: false,
    imageProcessing: false,
    marketing: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const allChecked = CONSENT_ITEMS.every((it) => consents[it.key])
  const requiredOk = CONSENT_ITEMS.filter((it) => it.required).every((it) => consents[it.key])

  const toggle = (key: keyof Consents) => setConsents((c) => ({ ...c, [key]: !c[key] }))
  const toggleAll = () => {
    const next = !allChecked
    setConsents({
      termsOfService: next,
      privacyPolicy: next,
      imageProcessing: next,
      marketing: next,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) return setToast('올바른 이메일 형식을 입력해 주세요.')
    if (!PW_RE.test(password)) return setToast('비밀번호는 영문·숫자 포함 8~20자여야 합니다.')
    if (!nickname.trim()) return setToast('닉네임을 입력해 주세요.')
    if (!requiredOk) return setToast('필수 약관에 모두 동의해 주세요.')

    setSubmitting(true)
    try {
      await signup({ email, password, nickname, consents })
      navigate('/permissions', { replace: true })
    } catch {
      setToast('가입에 실패했습니다. 이메일 중복 또는 입력값을 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-5 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30'

  return (
    <main className="min-h-screen bg-surface-bright pb-10">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center gap-3 bg-surface/80 px-5 py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">회원가입</h1>
      </header>

      <div className="mx-auto mt-20 w-full max-w-[600px] px-5 py-8">
        <section className="mb-8">
          <h2 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            HomeStyler에
            <br />
            오신 것을 환영해요
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            맞춤형 AI 인테리어 서비스를 위한 계정을 만들어 주세요.
          </p>
        </section>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* 계정 입력 */}
          <div className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 (영문·숫자 포함 8~20자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* 전체 동의 */}
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center rounded-lg border border-primary-container/20 bg-primary-container/10 p-5 text-left transition-all active:scale-[0.98]"
          >
            <CheckBox checked={allChecked} />
            <span className="ml-4 flex-grow font-label-md text-label-md text-primary">
              모든 필수 및 선택 약관에 전체 동의합니다.
            </span>
          </button>

          {/* 개별 동의 */}
          <div className="space-y-4">
            {CONSENT_ITEMS.map((it) => (
              <div
                key={it.key}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest/60 p-5"
              >
                <button
                  type="button"
                  onClick={() => toggle(it.key)}
                  className="flex w-full items-center text-left"
                >
                  <CheckBox checked={consents[it.key]} small />
                  <span className="ml-3 font-label-md text-label-md text-on-surface">{it.label}</span>
                </button>
                {it.hint && (
                  <div className="mt-4 flex items-start gap-4 rounded-lg bg-surface-container-low p-4">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{it.hint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-14 w-full rounded-lg bg-primary font-label-md text-label-md text-on-primary shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-on-surface-variant disabled:shadow-none"
          >
            {submitting ? '가입 중...' : '가입하고 시작하기'}
          </button>
          <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
            필수 항목에 모두 동의하셔야 서비스 이용이 가능합니다.
          </p>
        </form>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  )
}

function CheckBox({ checked, small }: { checked: boolean; small?: boolean }) {
  const size = small ? 'h-5 w-5' : 'h-6 w-6'
  return (
    <span
      className={`flex ${size} flex-none items-center justify-center rounded-lg border-2 transition-all ${
        checked ? 'border-primary bg-primary text-on-primary' : 'border-outline'
      }`}
    >
      {checked && <span className="material-symbols-outlined text-[16px]">check</span>}
    </span>
  )
}
