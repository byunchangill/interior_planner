// SAVE-002 추천안 비교 — 전용 폴더 없음(_6 카드 확장). POST /recommendations/compare
// 2~3열 비교. compareKey 탭(STYLE/BUDGET/LAYOUT/MATERIALS). sameSpace:false → 안내 배너(차단 아님). 열 탭 → 상세 이동
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { compare } from '../../api/save'
import { useFetch } from '../../hooks/useFetch'
import type { CompareKey, CompareColumn } from '../../types/save'
import { COMPARE_KEYS } from '../../types/save'
import { STYLE_LABELS } from '../../types/home'
import { STYLE_GRADIENTS } from '../../types/reco'
import { formatWon } from '../../utils/format'

export default function ComparePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [key, setKey] = useState<CompareKey>('STYLE')

  const ids = (params.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)

  const res = useFetch(() => compare(ids, key), [params.get('ids'), key])

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">추천안 비교</h1>
      </header>

      <main className="px-margin-mobile pt-20">
        {/* compareKey 탭 */}
        <nav className="-mx-margin-mobile mb-4 flex gap-2 overflow-x-auto px-margin-mobile no-scrollbar">
          {COMPARE_KEYS.map(({ key: k, label }) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={[
                'flex-none rounded-full px-5 py-2 font-label-md text-label-md transition-colors',
                k === key
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </nav>

        {res.state === 'loading' && (
          <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">비교 결과를 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <>
            {!res.data.sameSpace && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-tertiary-fixed/80 px-4 py-3 shadow-sm">
                <span
                  className="material-symbols-outlined shrink-0 text-[20px] text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  info
                </span>
                <p className="font-label-sm text-label-sm leading-snug text-on-surface-variant">
                  같은 공간끼리 비교할 때 가장 정확해요. 지금은 서로 다른 공간의 추천안을 비교하고 있어요.
                </p>
              </div>
            )}

            <CompareGrid columns={res.data.columns} activeKey={key} onOpen={(id) => navigate(`/reco/${id}`)} />
          </>
        )}
      </main>
    </div>
  )
}

function CompareGrid({
  columns,
  activeKey,
  onOpen,
}: {
  columns: CompareColumn[]
  activeKey: CompareKey
  onOpen: (id: number) => void
}) {
  const gridCols = columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  const rowRing = (k: CompareKey) =>
    k === activeKey ? 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background' : ''

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {columns.map((c) => (
        <button
          key={c.recommendationId}
          onClick={() => onOpen(c.recommendationId)}
          className="flex flex-col gap-2 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest text-left shadow-sm active:scale-[0.98]"
        >
          {/* 헤더: 썸네일 + 스타일 */}
          <div className="aspect-square w-full overflow-hidden" style={{ background: STYLE_GRADIENTS[c.style] }}>
            {c.thumbnailUrl ? (
              <img src={c.thumbnailUrl} alt={c.conceptTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white/70">chair</span>
              </div>
            )}
          </div>
          <div className="space-y-2 px-2.5 pb-3">
            <p className="font-label-md text-label-md text-primary">{STYLE_LABELS[c.style]}</p>
            <p className="line-clamp-2 font-body-sm text-body-sm font-semibold text-on-surface">{c.conceptTitle}</p>

            {/* STYLE: 키워드 */}
            <div className={`rounded-lg p-1.5 ${rowRing('STYLE')}`}>
              <p className="mb-1 text-[10px] font-bold text-outline">스타일</p>
              <div className="flex flex-wrap gap-1">
                {c.keywords.slice(0, 4).map((k) => (
                  <span
                    key={k}
                    className="rounded bg-secondary-container px-1.5 py-0.5 text-[10px] text-on-secondary-container"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </div>

            {/* BUDGET */}
            <div className={`rounded-lg p-1.5 ${rowRing('BUDGET')}`}>
              <p className="mb-0.5 text-[10px] font-bold text-outline">예산</p>
              <p className="font-headline-md text-[18px] text-on-surface">{formatWon(c.budgetTotal)}</p>
            </div>

            {/* LAYOUT: 적합도(공간 적합) */}
            <div className={`rounded-lg p-1.5 ${rowRing('LAYOUT')}`}>
              <p className="mb-0.5 text-[10px] font-bold text-outline">공간 적합도</p>
              <p className="font-headline-md text-[18px] text-primary">{c.fitScoreTotal}점</p>
            </div>

            {/* MATERIALS: 자재 색상 스와치 */}
            <div className={`rounded-lg p-1.5 ${rowRing('MATERIALS')}`}>
              <p className="mb-1 text-[10px] font-bold text-outline">자재</p>
              <div className="flex gap-1">
                {Object.entries(c.materialSummary).map(([name, color]) => (
                  <span
                    key={name}
                    title={name}
                    className="h-5 w-5 rounded-full border border-outline-variant"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
