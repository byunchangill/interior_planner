// RECO-007 추천 가구·소품 상세 — docs/_17
// 별도 API 없음. GET /recommendations/{id}의 items[]에서 itemId로 찾아 상세 표시.
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecommendation } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import { FURNITURE_TYPE_LABELS, STYLE_LABELS } from '../../types/reco'

export default function FurnitureDetailPage() {
  const { recommendationId, itemId } = useParams()
  const navigate = useNavigate()
  const recoId = Number(recommendationId)
  const itId = Number(itemId)
  const res = useFetch(() => getRecommendation(recoId), [recoId])

  const item = res.state === 'ok' ? res.data.items.find((i) => i.itemId === itId) : undefined
  const style = res.state === 'ok' ? res.data.style : undefined

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-between bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">가구 상세 정보</h1>
        <span className="w-8" />
      </header>

      {res.state === 'loading' && (
        <p className="px-margin-mobile pt-24 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
      )}
      {(res.state === 'error' || (res.state === 'ok' && !item)) && (
        <div className="mx-margin-mobile mt-24 rounded-xl bg-error-container p-4 text-on-error-container">
          <p className="font-label-md text-label-md">가구 정보를 찾을 수 없습니다</p>
        </div>
      )}

      {item && (
        <main className="space-y-stack-lg pt-20">
          {/* Hero */}
          <section className="px-margin-mobile">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-surface-container-high shadow-sm">
              <div className="flex h-full w-full items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-primary/30">chair</span>
              </div>
              <div className="absolute bottom-6 right-6">
                <span className="glass-card flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-primary">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    stars
                  </span>
                  AI 베스트 매치
                </span>
              </div>
            </div>
          </section>

          {/* 기본 정보 */}
          <section className="px-margin-mobile">
            <span className="font-label-md text-label-md tracking-wider text-primary">
              {style ? STYLE_LABELS[style] : ''} · {FURNITURE_TYPE_LABELS[item.category]}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant">{item.brand}</span>
            </div>
            <h2 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{item.name}</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md font-bold text-primary">
                {item.price.toLocaleString()}원
              </span>
            </div>
          </section>

          {/* 스펙 (치수 / 배치) */}
          <section className="px-margin-mobile">
            <div className="grid grid-cols-2 gap-4">
              <SpecCard icon="straighten" label="상세 치수">
                W {item.widthMm} × D {item.depthMm} × H {item.heightMm} (mm)
              </SpecCard>
              <SpecCard icon="place" label="추천 배치 위치">
                {item.position}
              </SpecCard>
            </div>
          </section>

          {/* AI 추천 이유 */}
          <section className="px-margin-mobile">
            <div className="glass-card rounded-3xl border-primary/10 p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span
                    className="material-symbols-outlined text-[18px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </span>
                <h3 className="font-headline-md text-headline-md text-primary">추천 이유</h3>
              </div>
              <p className="font-body-md leading-relaxed text-on-surface">{item.reason}</p>
            </div>
          </section>

          {item.expertRequired && (
            <section className="px-margin-mobile">
              <button
                onClick={() => navigate(`/reco/${recoId}/expert`)}
                className="flex w-full items-center gap-3 rounded-2xl border-l-4 border-error bg-error-container/40 p-4 text-left"
              >
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
                <p className="flex-1 font-label-md text-label-md text-on-surface">
                  이 항목은 전문가 확인이 필요합니다
                </p>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>
            </section>
          )}

          {/* 구매 링크 */}
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant bg-surface px-margin-mobile pb-8 pt-4">
            <a
              href={item.purchaseUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              구매 페이지로 이동
            </a>
          </div>
        </main>
      )}
    </div>
  )
}

function SpecCard({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-5">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        <span className="font-label-md text-label-md">{label}</span>
      </div>
      <p className="font-body-md font-semibold text-on-surface">{children}</p>
    </div>
  )
}
