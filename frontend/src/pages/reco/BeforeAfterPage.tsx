// RECO-006 전후 비교 뷰어 — docs/_5
// GET /recommendations/{id}/visuals의 before/after를 슬라이더로 비교.
// after에 "AI 생성 이미지" 표기. beforeUrl null(원본 삭제)이면 after 단독.
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getVisuals } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import AiNoticeBanner from '../../components/AiNoticeBanner'
import type { VisualPair } from '../../types/reco'

export default function BeforeAfterPage() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const id = Number(recommendationId)
  const res = useFetch(() => getVisuals(id), [id])

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">전후 비교</h1>
      </header>

      <main className="space-y-8 px-margin-mobile pt-20">
        {res.state === 'loading' && (
          <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">이미지를 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}
        {res.state === 'ok' && (
          <>
            {res.data.partial && (
              <AiNoticeBanner messages={['원본 사진이 삭제되어 일부 Before 이미지를 표시할 수 없습니다.']} />
            )}
            {res.data.pairs.map((pair, i) => (
              <ComparePair key={i} pair={pair} />
            ))}
            <AiNoticeBanner messages={['After 이미지는 AI 생성 결과로 실제 시공 결과와 다를 수 있습니다.']} />
          </>
        )}
      </main>
    </div>
  )
}

function ComparePair({ pair }: { pair: VisualPair }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50) // after clip 시작 %
  const dragging = useRef(false)

  const update = (clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let p = ((clientX - rect.left) / rect.width) * 100
    p = Math.max(0, Math.min(100, p))
    setPos(p)
  }

  // beforeUrl 없으면 After 단독 표시
  if (!pair.beforeUrl) {
    return (
      <section>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-surface-dim shadow-xl">
          <img src={pair.afterUrl} alt="After" className="h-full w-full object-cover" />
          <AfterWatermark />
          <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 font-label-md text-label-md text-on-primary shadow-md">
            After AI
          </span>
        </div>
        <p className="mt-3 text-center font-label-md text-label-md text-on-surface-variant">{pair.viewLabel}</p>
      </section>
    )
  }

  return (
    <section>
      <div
        ref={containerRef}
        className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-3xl bg-surface-dim shadow-xl"
        onMouseMove={(e) => dragging.current && update(e.clientX)}
        onMouseUp={() => (dragging.current = false)}
        onMouseLeave={() => (dragging.current = false)}
        onTouchMove={(e) => update(e.touches[0].clientX)}
      >
        {/* Before (base) */}
        <img src={pair.beforeUrl} alt="Before" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 font-label-md text-label-md text-white">
          Before
        </span>

        {/* After (clipped) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img src={pair.afterUrl} alt="After" className="h-full w-full object-cover" />
          <span className="absolute right-4 top-4 z-10 rounded-full bg-primary px-3 py-1 font-label-md text-label-md text-on-primary shadow-md">
            After AI
          </span>
          <AfterWatermark />
        </div>

        {/* Slider handle */}
        <div
          className="absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 cursor-ew-resize bg-white"
          style={{ left: `${pos}%` }}
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
        >
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg">
            <span className="material-symbols-outlined">swap_horiz</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center font-label-md text-label-md text-on-surface-variant opacity-70">
        {pair.viewLabel} · 핸들을 좌우로 밀어 비교하세요
      </p>
    </section>
  )
}

function AfterWatermark() {
  return (
    <div className="glass-card absolute bottom-6 right-6 z-30 flex items-center gap-2 rounded-xl px-4 py-2">
      <span
        className="material-symbols-outlined text-[18px] text-primary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
      <span className="font-label-md text-label-md font-bold text-primary">AI 생성 이미지</span>
    </div>
  )
}
