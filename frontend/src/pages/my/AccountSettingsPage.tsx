// MY-003 계정 설정 — docs/_14 ("Account & Settings" 한글판)
// GET /me/profile로 현재값 로드 → PATCH /me 닉네임·마케팅 동의 변경. VALID_001(닉네임 형식) 처리.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile } from '../../api/my'
import { apiErrorCode } from '../../api/client'
import { ERR } from '../../types/my'
import Toast from '../../components/Toast'

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getProfile()
      .then((p) => {
        setEmail(p.email)
        setNickname(p.nickname)
        setMarketing(p.consents.marketing)
      })
      .catch(() => setToast('프로필을 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }, [])

  const nickValid = nickname.trim().length >= 1 && nickname.trim().length <= 20

  async function onSave() {
    if (!nickValid) {
      setToast('닉네임은 1~20자로 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ nickname: nickname.trim(), marketing })
      setToast('변경사항을 저장했어요')
    } catch (e) {
      setToast(apiErrorCode(e) === ERR.VALID_001 ? '닉네임 형식을 확인해 주세요.' : '저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">계정 설정</h1>
      </header>

      <main className="px-margin-mobile pt-24">
        {loading ? (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        ) : (
          <>
            {/* 프로필 편집 */}
            <section className="mb-stack-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
              <h2 className="mb-1 font-headline-md text-headline-md text-primary">프로필 편집</h2>
              <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
                회원님의 기본 정보를 관리하세요.
              </p>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="nickname">
                  닉네임
                </label>
                <input
                  id="nickname"
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-12 w-full rounded-xl border border-outline-variant px-4 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="1~20자"
                />
                <span className="text-right font-label-sm text-label-sm text-on-surface-variant">
                  {nickname.trim().length}/20
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                  이메일 주소
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 font-body-md text-body-md text-on-surface-variant"
                />
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  이메일은 변경할 수 없습니다.
                </span>
              </div>
            </section>

            {/* 마케팅 수신 동의 */}
            <section className="mb-stack-lg">
              <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-4 pr-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md">마케팅 정보 수신 동의</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      새로운 스타일·이벤트 소식 받기 (선택)
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
            </section>

            <button
              onClick={onSave}
              disabled={saving}
              className="h-14 w-full rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-md transition-all active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
            >
              {saving ? '저장 중…' : '변경사항 저장'}
            </button>
          </>
        )}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
