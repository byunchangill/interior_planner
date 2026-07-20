// MY-004 회원 탈퇴 — docs/_25
// 경고 안내 + 비밀번호 재확인 → DELETE /me. 성공 시 토큰 삭제 + 로그인/온보딩으로.
// AUTH_001(비번 불일치)·AI_005(진행 중 분석) 처리.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount } from '../../api/my'
import { logout } from '../../api/auth'
import { apiErrorCode } from '../../api/client'
import { ERR } from '../../types/my'
import Toast from '../../components/Toast'

const DELETE_ITEMS = [
  'AI가 생성한 모든 인테리어 스타일링 사진',
  '업로드한 원본 사진·평면도 및 공간 분석 리포트',
  '맞춤형 가구 추천 결과 및 저장·공유 내역',
]

export default function WithdrawPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const canSubmit = agreed && password.length > 0 && !submitting

  async function onWithdraw() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await deleteAccount(password)
      // 성공: 토큰 삭제 + 인증 상태 초기화 후 공개 화면으로
      await logout()
      navigate('/login', { replace: true })
    } catch (e) {
      const code = apiErrorCode(e)
      if (code === ERR.AUTH_001) setToast('비밀번호가 일치하지 않습니다.')
      else if (code === ERR.AI_005) setToast('진행 중인 AI 분석이 있어요. 완료 또는 취소 후 다시 시도해 주세요.')
      else setToast('탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="fixed top-0 left-1/2 z-50 flex h-14 w-full max-w-md -translate-x-1/2 items-center bg-surface px-margin-mobile shadow-sm">
        <button onClick={() => navigate(-1)} className="text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-headline-md text-headline-md font-bold text-primary">
          회원 탈퇴
        </h1>
      </header>

      <main className="px-margin-mobile pt-20">
        {/* 경고 안내 */}
        <section className="mb-stack-lg">
          <div className="mb-stack-md flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-[32px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">정말 탈퇴하시겠어요?</h2>
          </div>
          <div className="space-y-stack-sm rounded-xl border border-error/20 bg-error-container/30 p-stack-md">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              탈퇴 시 다음 데이터가 영구적으로 삭제됩니다:
            </p>
            <ul className="space-y-unit">
              {DELETE_ITEMS.map((t) => (
                <li key={t} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-error">close</span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="pt-unit font-label-sm text-label-sm text-error">
              ※ 삭제된 데이터는 복구가 불가능하며, 동일 계정으로 재가입 시에도 복원되지 않습니다.
            </p>
          </div>
        </section>

        {/* 비밀번호 재확인 */}
        <section className="mb-stack-lg">
          <label htmlFor="pw" className="mb-2 block font-label-md text-label-md text-on-surface-variant">
            본인 확인을 위해 비밀번호를 입력해 주세요
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-5 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </section>

        {/* 최종 동의 */}
        <section className="mb-stack-lg">
          <label className="flex cursor-pointer items-start gap-stack-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-outline text-primary focus:ring-primary"
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              상기 데이터 삭제 및 주의사항을 모두 확인하였으며, 이에 동의합니다.
            </span>
          </label>
        </section>
      </main>

      {/* 하단 액션 바 */}
      <footer className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 gap-stack-md border-t border-outline-variant bg-surface p-margin-mobile shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={onWithdraw}
          disabled={!canSubmit}
          className="h-14 flex-1 rounded-xl bg-error font-label-md text-label-md text-on-error transition-all active:scale-95 disabled:bg-surface-container-highest disabled:text-on-surface-variant"
        >
          {submitting ? '처리 중…' : '탈퇴하기'}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="h-14 flex-[2] rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-sm transition-all active:scale-95"
        >
          유지하기
        </button>
      </footer>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
