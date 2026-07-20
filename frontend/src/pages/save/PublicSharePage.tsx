// 공개 공유 뷰 — GET /share/{token} (비인증). RequireAuth 밖 · 하단 탭 없는 독립 레이아웃.
// 보기 전용 렌더링. 410(SHARE_001) → "만료되었거나 회수된 링크입니다" 안내.
import { useParams } from 'react-router-dom'
import { getPublicShare } from '../../api/save'
import { useFetch } from '../../hooks/useFetch'
import { SHARE_EXPIRED } from '../../types/save'
import { STYLE_LABELS } from '../../types/home'
import { STYLE_GRADIENTS } from '../../types/reco'
import { formatWon, formatDims } from '../../utils/format'

const MATERIAL_LABELS: Record<string, string> = {
  wallpaper: '벽지',
  flooring: '바닥재',
  lighting: '조명',
  curtain: '커튼',
}

export default function PublicSharePage() {
  const { token } = useParams()
  const res = useFetch(() => getPublicShare(token ?? ''), [token])

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background text-on-surface">
      {/* 독립 헤더 (앱 탭 없음) */}
      <header className="flex items-center gap-2 px-margin-mobile py-4">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          cottage
        </span>
        <span className="font-headline-md text-headline-md font-bold text-primary">HomeStyler</span>
        <span className="ml-auto rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
          조회 전용
        </span>
      </header>

      {res.state === 'loading' && (
        <p className="py-24 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
      )}

      {res.state === 'error' &&
        (res.message === SHARE_EXPIRED ? (
          <ExpiredView />
        ) : (
          <div className="mx-margin-mobile mt-8 rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">추천을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        ))}

      {res.state === 'ok' && (
        <main className="space-y-stack-lg px-margin-mobile pb-16">
          {/* 히어로 */}
          <section className="relative overflow-hidden rounded-2xl shadow-md">
            <div className="aspect-[4/3] w-full" style={{ background: STYLE_GRADIENTS[res.data.style] }}>
              {res.data.afterImageUrl && (
                <img src={res.data.afterImageUrl} alt={res.data.conceptTitle} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="glass-card absolute bottom-0 left-0 flex w-full items-center justify-between p-4">
              <div>
                <p className="font-label-md text-label-md text-primary">{STYLE_LABELS[res.data.style]}</p>
                <h1 className="font-headline-md text-headline-md text-on-surface">{res.data.conceptTitle}</h1>
              </div>
              <div className="rounded-full bg-secondary-container px-3 py-1">
                <p className="text-[10px] font-bold text-on-secondary-container">적합도 {res.data.fitScoreTotal}점</p>
              </div>
            </div>
          </section>

          {/* 콘셉트 */}
          <section>
            <p className="font-body-md leading-relaxed text-on-surface-variant">{res.data.conceptDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {res.data.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-lg bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container"
                >
                  #{k}
                </span>
              ))}
            </div>
          </section>

          {/* 예산 */}
          <section className="flex items-center justify-between rounded-xl bg-surface-container p-5">
            <span className="font-label-md text-label-md text-outline">예상 예산</span>
            <span className="font-headline-md text-headline-md text-on-surface">{formatWon(res.data.budgetTotal)}</span>
          </section>

          {/* 자재 */}
          <section>
            <h2 className="mb-3 font-label-md text-label-md text-on-surface">주요 자재</h2>
            <div className="space-y-2">
              {Object.entries(res.data.materials).map(([key, m]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-outline-variant"
                    style={{ backgroundColor: m.color }}
                  />
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {MATERIAL_LABELS[key] ?? key}
                    </p>
                    <p className="font-body-md text-on-surface">{m.material}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 가구·소품 (조회 전용 — 구매링크 없음) */}
          {res.data.items.length > 0 && (
            <section>
              <h2 className="mb-3 font-label-md text-label-md text-on-surface">추천 가구·소품</h2>
              <div className="space-y-2">
                {res.data.items.map((it, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                  >
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{it.brand}</p>
                    <p className="font-body-md font-semibold text-on-surface">{it.name}</p>
                    <div className="mt-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{formatDims(it.widthMm, it.depthMm, it.heightMm)}</span>
                      <span>{it.position}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 원본 사진 (링크 생성 시 포함한 경우만) */}
          {res.data.originalPhotos.length > 0 && (
            <section>
              <h2 className="mb-3 font-label-md text-label-md text-on-surface">원본 공간 사진</h2>
              <div className="grid grid-cols-2 gap-2">
                {res.data.originalPhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`원본 사진 ${i + 1}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          {/* AI 고지 */}
          <section className="flex items-start gap-2 rounded-xl bg-tertiary-fixed/70 px-4 py-3">
            <span
              className="material-symbols-outlined shrink-0 text-[20px] text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div className="space-y-0.5">
              {(res.data.disclaimers.length > 0
                ? res.data.disclaimers
                : ['본 추천은 AI 분석 결과로 실제와 다를 수 있습니다.']
              ).map((d, i) => (
                <p key={i} className="font-label-sm text-label-sm leading-snug text-on-surface-variant">
                  {d}
                </p>
              ))}
            </div>
          </section>

          {/* CTA */}
          <a
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-label-md text-label-md font-bold text-on-primary active:scale-[0.98]"
          >
            HomeStyler에서 나만의 추천 받기
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </a>
        </main>
      )}
    </div>
  )
}

function ExpiredView() {
  return (
    <div className="flex flex-col items-center gap-4 px-margin-mobile py-24 text-center">
      <span className="material-symbols-outlined text-6xl text-outline-variant">link_off</span>
      <h2 className="font-headline-md text-headline-md text-on-surface">만료되었거나 회수된 링크입니다</h2>
      <p className="font-body-md text-on-surface-variant">
        공유한 사람이 링크를 만료·회수했거나 유효 기간이 지났어요.
      </p>
      <a
        href="/"
        className="mt-2 rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary active:scale-95"
      >
        HomeStyler 둘러보기
      </a>
    </div>
  )
}
