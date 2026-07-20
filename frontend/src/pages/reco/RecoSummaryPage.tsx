// RECO-004 추천 결과 요약 — docs/_4
// GET /analyses/{id}로 recommendationIds 확보 → 스타일별 탭 → 각 추천안 요약(GET /recommendations/{id})
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnalysis, getRecommendation } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import AiNoticeBanner from '../../components/AiNoticeBanner'
import { STYLE_LABELS } from '../../types/reco'

export default function RecoSummaryPage() {
  const { analysisId } = useParams()
  const navigate = useNavigate()
  const id = Number(analysisId)

  const analysis = useFetch(() => getAnalysis(id), [id])
  const recIds = analysis.state === 'ok' ? analysis.data.recommendationIds : []
  const [activeIdx, setActiveIdx] = useState(0)
  const activeId = recIds[activeIdx]

  const reco = useFetch(
    () => (activeId ? getRecommendation(activeId) : Promise.reject(new Error('추천안 없음'))),
    [activeId],
  )

  return (
    <div className="min-h-screen bg-background pb-44">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate('/reco')} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">분석 결과 요약</h1>
      </header>

      <main className="space-y-stack-lg px-margin-mobile pt-20">
        {analysis.state === 'loading' && <Loading />}
        {analysis.state === 'error' && <ErrorBox message={analysis.message} />}

        {analysis.state === 'ok' && recIds.length === 0 && (
          <ErrorBox message="생성된 추천안이 없습니다." />
        )}

        {analysis.state === 'ok' && recIds.length > 0 && (
          <>
            {/* 메인 After 이미지 */}
            <section className="relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-surface-container-high shadow-lg">
                {reco.state === 'ok' && reco.data.layout.imageUrl ? (
                  <img src={reco.data.layout.imageUrl} alt="추천 레이아웃" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-outline-variant">image</span>
                  </div>
                )}
              </div>
              <div className="glass-card absolute left-6 top-6 flex items-center gap-2 rounded-xl px-4 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm font-bold text-on-surface">AI 제안 스타일</span>
              </div>
              {reco.state === 'ok' && (
                <button
                  onClick={() => navigate(`/reco/${reco.data.recommendationId}/compare`)}
                  className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-white shadow-xl active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">compare</span>
                  <span className="font-label-md text-label-md">전후 비교</span>
                </button>
              )}
            </section>

            {/* 스타일 탭 */}
            <nav className="-mx-margin-mobile flex gap-2 overflow-x-auto px-margin-mobile py-1 no-scrollbar">
              {recIds.map((rid, i) => {
                const active = i === activeIdx
                const label =
                  reco.state === 'ok' && reco.data.recommendationId === rid
                    ? STYLE_LABELS[reco.data.style]
                    : `추천안 ${i + 1}`
                return (
                  <button
                    key={rid}
                    onClick={() => setActiveIdx(i)}
                    className={[
                      'flex-none rounded-full px-6 py-2.5 font-label-md text-label-md transition-colors',
                      active
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </nav>

            {reco.state === 'loading' && <Loading />}
            {reco.state === 'error' && <ErrorBox message={reco.message} />}

            {reco.state === 'ok' && (
              <>
                {/* 콘셉트 카드 */}
                <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm">
                  <h2 className="mb-2 font-headline-md text-headline-md text-on-surface">
                    {reco.data.concept.title}
                  </h2>
                  <p className="font-body-md leading-relaxed text-on-surface-variant">
                    {reco.data.concept.description}
                  </p>
                  <div className="mt-stack-md flex flex-wrap gap-2">
                    {reco.data.concept.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-lg bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </section>

                {/* 주요 지표: 적합도 + 예산 + 컬러 */}
                <section className="space-y-4 rounded-3xl bg-surface-container p-stack-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline">공간 적합도 점수</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-md text-headline-md text-primary">
                        {reco.data.fitScore.total}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">/ 100</span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-outline-variant" />
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline">예상 예산 (균형형)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-md text-headline-md text-on-surface">
                        {formatWon(reco.data.budgetPlans[1]?.totalPrice ?? reco.data.budgetPlans[0]?.totalPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-outline-variant" />
                  <div>
                    <span className="mb-2 block font-label-sm text-label-sm text-outline">주요 컬러 팔레트</span>
                    <div className="flex gap-2">
                      {Object.values(reco.data.materials).map((m, i) => (
                        <div
                          key={i}
                          className="h-10 w-10 rounded-full border border-outline-variant shadow-sm"
                          style={{ backgroundColor: m.color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-px w-full bg-outline-variant" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mb-1 block font-label-sm text-label-sm text-outline">추천 가구</span>
                      <span className="font-headline-md text-headline-md text-on-surface">
                        {reco.data.items.length} <small className="text-body-sm">개</small>
                      </span>
                    </div>
                    <span
                      className="material-symbols-outlined text-4xl text-primary/20"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      chair
                    </span>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* 하단 고정 배너 + CTA */}
      {reco.state === 'ok' && (
        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 space-y-3 px-4 pb-6 pt-2">
          <AiNoticeBanner messages={reco.data.disclaimers} />
          <button
            onClick={() => navigate(`/reco/${reco.data.recommendationId}`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-label-md text-label-md font-bold text-white shadow-xl active:scale-[0.98]"
          >
            <span>상세 결과 보기</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward_ios</span>
          </button>
        </div>
      )}
    </div>
  )
}

function formatWon(n?: number): string {
  if (n == null) return '-'
  return `${Math.round(n / 10000).toLocaleString()}만원`
}

function Loading() {
  return (
    <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
  )
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-error-container p-4 text-on-error-container">
      <p className="font-label-md text-label-md">결과를 불러오지 못했습니다</p>
      <p className="mt-1 font-body-sm text-body-sm">{message}</p>
    </div>
  )
}
