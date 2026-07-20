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

// 개인정보보호법(제15·22·23조) 준수: 필수/선택 분리, 수집 항목·목적·보유기간·거부권 고지.
// AI 학습 활용은 서비스 제공에 필수가 아니므로 '선택'으로 분리(끼워팔기 동의 금지).
const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'termsOfService',
    label: '[필수] 서비스 이용약관 동의',
    required: true,
    hint: 'HomeStyler 서비스 이용 조건과 회원의 권리·의무에 동의합니다.',
  },
  {
    key: 'privacyPolicy',
    label: '[필수] 개인정보 수집·이용 동의',
    required: true,
    hint: '수집 항목: 이메일, 비밀번호(암호화), 닉네임 · 이용 목적: 회원 식별·서비스 제공 · 보유 기간: 회원 탈퇴 시까지(관계 법령에 따른 보존 항목 제외). 동의를 거부할 수 있으나 이 경우 회원가입이 제한됩니다.',
  },
  {
    key: 'imageProcessing',
    label: '[필수] 공간 사진·도면 처리 동의',
    required: true,
    hint: '수집 항목: 업로드한 공간 사진·도면 · 이용 목적: AI 맞춤 인테리어 추천 제공 · 보유 기간: 사용자가 삭제하거나 탈퇴할 때까지(즉시 영구 삭제). 위치정보(EXIF GPS)는 업로드 시 자동 제거됩니다. 서비스 제공에 필요한 항목이므로 거부 시 공간 등록·추천 기능을 이용할 수 없습니다.',
  },
  {
    key: 'aiTraining',
    label: '[선택] AI 모델 학습 활용 동의',
    required: false,
    hint: '익명화 처리한 데이터를 AI 모델 품질 개선에 활용합니다. 동의하지 않아도 맞춤 추천 등 모든 서비스를 그대로 이용할 수 있으며, 마이페이지에서 언제든 변경할 수 있습니다.',
  },
  {
    key: 'marketing',
    label: '[선택] 마케팅 정보 수신 동의',
    required: false,
    hint: '이메일 등으로 이벤트·혜택 정보를 받습니다. 동의하지 않아도 서비스 이용에 제한이 없으며, 언제든 수신을 해지할 수 있습니다.',
  },
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
    aiTraining: false,
    marketing: false,
  })
  // 만 14세 이상 확인 (개인정보보호법 제22조의2 — 14세 미만은 법정대리인 동의 필요)
  const [age14, setAge14] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const allChecked = age14 && CONSENT_ITEMS.every((it) => consents[it.key])
  const requiredOk = age14 && CONSENT_ITEMS.filter((it) => it.required).every((it) => consents[it.key])

  const toggle = (key: keyof Consents) => setConsents((c) => ({ ...c, [key]: !c[key] }))
  const toggleAll = () => {
    const next = !allChecked
    setAge14(next)
    setConsents({
      termsOfService: next,
      privacyPolicy: next,
      imageProcessing: next,
      aiTraining: next,
      marketing: next,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) return setToast('올바른 이메일 형식을 입력해 주세요.')
    if (!PW_RE.test(password)) return setToast('비밀번호는 영문·숫자 포함 8~20자여야 합니다.')
    if (!nickname.trim()) return setToast('닉네임을 입력해 주세요.')
    if (!age14) return setToast('만 14세 이상만 가입할 수 있습니다.')
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

          {/* 만 14세 이상 확인 (필수) */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest/60 p-5">
            <button
              type="button"
              onClick={() => setAge14((v) => !v)}
              className="flex w-full items-center text-left"
            >
              <CheckBox checked={age14} small />
              <span className="ml-3 font-label-md text-label-md text-on-surface">
                [필수] 만 14세 이상입니다
              </span>
            </button>
          </div>

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
