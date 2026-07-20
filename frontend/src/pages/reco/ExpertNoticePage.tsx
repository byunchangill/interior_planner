// RECO-008 전문가 확인 안내 — docs/_11
// GET /recommendations/{id}에서 expertRequired인 materials·items를 모아 위험 항목으로 안내.
import { useNavigate, useParams } from 'react-router-dom'
import { getRecommendation } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import { FURNITURE_TYPE_LABELS, MATERIAL_KEYS } from '../../types/reco'

interface Risk {
  title: string
  reason: string
  icon: string
  tag: string
}

export default function ExpertNoticePage() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const id = Number(recommendationId)
  const res = useFetch(() => getRecommendation(id), [id])

  const risks: Risk[] = []
  if (res.state === 'ok') {
    MATERIAL_KEYS.forEach(({ key, label }) => {
      const m = res.data.materials[key]
      if (m.expertRequired) {
        risks.push({ title: `${label} — ${m.material}`, reason: m.reason, icon: 'format_paint', tag: '마감·설비' })
      }
    })
    res.data.items.forEach((it) => {
      if (it.expertRequired) {
        risks.push({
          title: it.name,
          reason: it.reason,
          icon: 'construction',
          tag: FURNITURE_TYPE_LABELS[it.category],
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">전문가 확인 필수</h1>
      </header>

      <main className="px-margin-mobile pt-24">
        {res.state === 'loading' && (
          <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <>
            {/* 경고 히어로 */}
            <section className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-fixed">
                <span
                  className="material-symbols-outlined text-4xl text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>
              </div>
              <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                안전한 시공을 위해
                <br />
                전문가 검토가 필요합니다
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                AI가 제안한 항목 중 기술적 검토가 선행되어야 하는 항목이 있습니다.
              </p>
            </section>

            {/* 위험 항목 카드 */}
            {risks.length === 0 ? (
              <div className="rounded-2xl bg-secondary-container p-6 text-center text-on-secondary-container">
                <span className="material-symbols-outlined mb-2 text-4xl">verified</span>
                <p className="font-label-md text-label-md">전문가 확인이 필요한 항목이 없습니다.</p>
              </div>
            ) : (
              <div className="mb-10 space-y-4">
                {risks.map((r, i) => (
                  <div key={i} className="glass-card relative overflow-hidden rounded-xl border-l-4 border-error p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="mb-2 inline-flex w-fit items-center rounded bg-error px-2 py-0.5 font-label-sm text-label-sm text-on-error">
                          전문가 확인 없이 진행하지 마세요
                        </span>
                        <h3 className="font-headline-md text-headline-md text-on-surface">{r.title}</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-error">{r.icon}</span>
                    </div>
                    <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">{r.reason}</p>
                    <div className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">유형: {r.tag}</span>
                      <span className="material-symbols-outlined text-primary">info</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 전문가 찾기 (스텁) */}
            <section className="mb-8 rounded-2xl bg-surface-container-high p-6 text-center">
              <h4 className="mb-2 font-headline-md text-headline-md text-on-surface">우리 동네 전문가 찾기</h4>
              <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
                검증된 면허 보유 업체와 상담하고
                <br />
                안전한 시공 견적을 받아보세요.
              </p>
              <div className="flex cursor-default items-center justify-between rounded-xl bg-primary px-6 py-4 font-label-md text-label-md text-on-primary shadow-lg opacity-90">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">engineering</span>
                  지역별 전문 시공사 연결 (준비 중)
                </span>
                <span className="material-symbols-outlined">open_in_new</span>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
