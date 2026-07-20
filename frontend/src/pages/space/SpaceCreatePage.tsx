// SPACE-002 공간 등록·유형 선택 — docs/_24
// 유형 선택(+ 이름 선택 입력) → POST /spaces → 사진 촬영 가이드(SPACE-003)로 이동.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSpace } from '../../api/space'
import Toast from '../../components/Toast'
import {
  SPACE_TYPES,
  SPACE_TYPE_LABELS,
  SPACE_TYPE_ICONS,
  type SpaceType,
} from '../../types/space'

export default function SpaceCreatePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SpaceType | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function onNext() {
    if (!selected) return
    setSubmitting(true)
    try {
      const space = await createSpace({ spaceType: selected, name: name.trim() || undefined })
      navigate(`/spaces/${space.spaceId}/photos`, { replace: true })
    } catch {
      setToast('공간 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-1 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">공간 등록</h1>
      </header>

      <main className="px-margin-mobile pt-24">
        <section className="mb-stack-lg">
          <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            어떤 공간을 꾸미고 싶으신가요?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            스타일링을 시작할 공간의 유형을 선택해 주세요. AI가 최적화된 맞춤 디자인을 제안합니다.
          </p>
        </section>

        {/* 유형 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {SPACE_TYPES.map((type) => {
            const active = selected === type
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={`glass-card flex aspect-square flex-col items-center justify-center rounded-xl p-stack-md transition-all ${
                  active ? 'border-2 border-primary bg-primary-fixed' : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className={`mb-stack-sm flex h-12 w-12 items-center justify-center rounded-full transition-transform ${
                    active ? 'bg-primary text-white' : 'bg-primary-container/10 text-primary'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {SPACE_TYPE_ICONS[type]}
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface">
                  {SPACE_TYPE_LABELS[type]}
                </span>
              </button>
            )
          })}
        </div>

        {/* 이름 (선택) */}
        <div className="mt-stack-lg space-y-1">
          <label className="font-label-md text-label-md text-on-surface-variant">
            공간 이름 (선택)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selected ? SPACE_TYPE_LABELS[selected] : '예: 우리집 거실'}
            className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-5 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* AI 팁 */}
        <div className="glass-card mt-stack-lg rounded-2xl border border-primary/10 p-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <div>
              <h4 className="mb-1 font-label-md text-label-md text-primary">AI 스타일링 팁</h4>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                공간 유형을 선택하면 해당 공간에 맞는 조명 배치와 가구 추천이 활성화됩니다. 사진 촬영
                시 공간 전체가 잘 보이도록 넓은 각도에서 찍어 주세요.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-outline-variant bg-surface/90 px-margin-mobile py-4 backdrop-blur-md">
        <button
          onClick={onNext}
          disabled={!selected || submitting}
          className="h-14 w-full rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-on-surface-variant disabled:shadow-none"
        >
          {submitting ? '생성 중...' : '다음 단계로 이동'}
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
