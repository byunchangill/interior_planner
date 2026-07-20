// RECO-005 추천 결과 상세 — 전용 폴더 없음(_4 섹션 + IA 8섹션)
// GET /recommendations/{id}의 8개 섹션 렌더. 최상단 AI 고지 배너 고정, reason 표시,
// expertRequired 경고 배지 → RECO-008, fitScore GOOD/CHECK/BLOCKED 신호등 + measureBeforeBuy.
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecommendation } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import AiNoticeBanner from '../../components/AiNoticeBanner'
import {
  STYLE_LABELS,
  FURNITURE_TYPE_LABELS,
  BUDGET_LABELS,
  MATERIAL_KEYS,
  VERDICT_META,
  type MaterialSpec,
  type RecoItem,
} from '../../types/reco'

export default function RecommendationDetailPage() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const id = Number(recommendationId)
  const res = useFetch(() => getRecommendation(id), [id])

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">추천 상세</h1>
      </header>

      {res.state === 'loading' && (
        <p className="px-margin-mobile pt-24 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
      )}
      {res.state === 'error' && (
        <div className="mx-margin-mobile mt-24 rounded-xl bg-error-container p-4 text-on-error-container">
          <p className="font-label-md text-label-md">상세를 불러오지 못했습니다</p>
          <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
        </div>
      )}

      {res.state === 'ok' &&
        (() => {
          const r = res.data
          const expertCount =
            Object.values(r.materials).filter((m) => m.expertRequired).length +
            r.items.filter((i) => i.expertRequired).length
          return (
            <main className="pt-[68px]">
              {/* 최상단 고정 AI 한계 고지 (FR-RECO-012) */}
              <div className="bg-background px-margin-mobile pt-3">
                <AiNoticeBanner messages={r.disclaimers} sticky />
              </div>

              <div className="space-y-stack-lg px-margin-mobile pt-5">
                {/* 1. 콘셉트 */}
                <section>
                  <StyleChip label={STYLE_LABELS[r.style]} />
                  <h2 className="mt-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    {r.concept.title}
                  </h2>
                  <p className="mt-2 font-body-md leading-relaxed text-on-surface-variant">
                    {r.concept.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.concept.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-lg bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </section>

                {/* 2. 적합도 점수 (신호등) */}
                <SectionCard icon="verified" title="공간 적합도">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-headline-lg text-headline-lg text-primary">{r.fitScore.total}</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">/ 100점</span>
                  </div>
                  <div className="space-y-2">
                    {r.fitScore.checks.map((c, i) => {
                      const m = VERDICT_META[c.verdict]
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3"
                        >
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-label-md text-on-surface">{c.label}</span>
                              <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${m.badge}`}>
                                {m.label}
                              </span>
                            </div>
                            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{c.detail}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {r.fitScore.measureBeforeBuy.length > 0 && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-tertiary-fixed/50 p-3">
                      <span className="material-symbols-outlined text-[20px] text-tertiary">straighten</span>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">구매 전 실측 권장</p>
                        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                          {r.fitScore.measureBeforeBuy.join(' · ')}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* 3. 레이아웃 */}
                <SectionCard icon="dashboard" title="공간 배치">
                  <div className="mb-3 aspect-video w-full overflow-hidden rounded-2xl bg-surface-container-high">
                    {r.layout.imageUrl ? (
                      <img src={r.layout.imageUrl} alt="배치도" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-outline-variant">map</span>
                      </div>
                    )}
                  </div>
                  <p className="font-body-md text-on-surface">{r.layout.flowDescription}</p>
                  <ReasonLine reason={r.layout.reason} />
                </SectionCard>

                {/* 4. 마감재 */}
                <SectionCard icon="format_paint" title="마감재 & 컬러">
                  <div className="space-y-3">
                    {MATERIAL_KEYS.map(({ key, label, icon }) => (
                      <MaterialRow
                        key={key}
                        icon={icon}
                        label={label}
                        spec={r.materials[key]}
                        onExpert={() => navigate(`/reco/${id}/expert`)}
                      />
                    ))}
                  </div>
                </SectionCard>

                {/* 5. 공간 활용 팁 */}
                {r.spaceTips.length > 0 && (
                  <SectionCard icon="tips_and_updates" title="공간 활용 팁">
                    <BulletList items={r.spaceTips} />
                  </SectionCard>
                )}

                {/* 6. 수납 */}
                {r.storage.length > 0 && (
                  <SectionCard icon="inventory_2" title="수납 아이디어">
                    <BulletList items={r.storage} />
                  </SectionCard>
                )}

                {/* 7. 유지 가구 배치 (nullable → 섹션 숨김) */}
                {r.keepFurnitureLayout && (
                  <SectionCard icon="chair" title="기존 가구 유지 배치">
                    <p className="font-body-md text-on-surface">{r.keepFurnitureLayout.description}</p>
                  </SectionCard>
                )}

                {/* 8. 예산 플랜 */}
                <SectionCard icon="savings" title="예산별 플랜">
                  <div className="space-y-2">
                    {r.budgetPlans.map((p) => (
                      <div
                        key={p.range}
                        className="flex items-center justify-between rounded-xl bg-surface-container-low p-4"
                      >
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{p.title}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {BUDGET_LABELS[p.range]} · {p.itemIds.length}개 품목
                          </p>
                        </div>
                        <span className="font-headline-md text-headline-md text-primary">
                          {formatWon(p.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 추천 가구 (items → RECO-007 상세) */}
                <SectionCard icon="storefront" title="추천 가구 · 소품">
                  <div className="space-y-3">
                    {r.items.map((it) => (
                      <ItemCard
                        key={it.itemId}
                        item={it}
                        onClick={() => navigate(`/reco/${id}/items/${it.itemId}`)}
                      />
                    ))}
                  </div>
                </SectionCard>

                {/* 전문가 확인 안내 (RECO-008) */}
                {expertCount > 0 && (
                  <button
                    onClick={() => navigate(`/reco/${id}/expert`)}
                    className="flex w-full items-center gap-3 rounded-2xl border-l-4 border-error bg-error-container/40 p-4 text-left"
                  >
                    <span
                      className="material-symbols-outlined text-error"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      warning
                    </span>
                    <div className="flex-1">
                      <p className="font-label-md text-label-md text-on-surface">
                        전문가 확인이 필요한 항목 {expertCount}건
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        안전한 시공을 위해 검토가 필요합니다
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </button>
                )}
              </div>
            </main>
          )
        })()}
    </div>
  )
}

function StyleChip({ label }: { label: string }) {
  return (
    <span className="font-label-md text-label-md tracking-wider text-primary">{label} 스타일</span>
  )
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
        <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ReasonLine({ reason }: { reason: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-fixed/40 p-3">
      <span
        className="material-symbols-outlined text-[18px] text-primary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        <span className="font-semibold text-primary">추천 이유 </span>
        {reason}
      </p>
    </div>
  )
}

function MaterialRow({
  icon,
  label,
  spec,
  onExpert,
}: {
  icon: string
  label: string
  spec: MaterialSpec
  onExpert: () => void
}) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 shrink-0 rounded-full border border-outline-variant shadow-sm"
          style={{ backgroundColor: spec.color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
            <span className="font-label-md text-label-md text-on-surface">{label}</span>
            {spec.expertRequired && (
              <button
                onClick={onExpert}
                className="ml-auto flex items-center gap-1 rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm text-on-error"
              >
                <span className="material-symbols-outlined text-[14px]">warning</span>
                전문가 확인
              </button>
            )}
          </div>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface">{spec.material}</p>
        </div>
      </div>
      <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
        <span className="font-semibold text-primary">이유 </span>
        {spec.reason}
      </p>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <span className="font-body-md text-on-surface-variant">{t}</span>
        </li>
      ))}
    </ul>
  )
}

function ItemCard({ item, onClick }: { item: RecoItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 text-left transition-all active:scale-[0.99]"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container-high">
        <span className="material-symbols-outlined text-3xl text-primary/40">chair</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-label-sm text-label-sm text-primary">{item.brand}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            · {FURNITURE_TYPE_LABELS[item.category]}
          </span>
          {item.expertRequired && (
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
          )}
        </div>
        <p className="truncate font-label-md text-label-md text-on-surface">{item.name}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {formatWon(item.price)} · {item.position}
        </p>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
    </button>
  )
}

function formatWon(n: number): string {
  return `${Math.round(n / 10000).toLocaleString()}만원`
}
