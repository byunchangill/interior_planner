// HOME-002 스타일 갤러리 — docs/_15
// GET /styles: 스타일 카드 그리드 + 카테고리 칩(styleType 클라이언트 필터).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStyles } from '../../api/home'
import { useFetch } from '../../hooks/useFetch'
import { STYLE_LABELS, STYLE_TYPES, type StyleType } from '../../types/home'

export default function StyleGalleryPage() {
  const res = useFetch(getStyles)
  const [filter, setFilter] = useState<StyleType | 'ALL'>('ALL')

  const items =
    res.state === 'ok'
      ? res.data.filter((it) => filter === 'ALL' || it.styleType === filter)
      : []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Style Gallery</h1>
      </header>

      <main className="px-margin-mobile pt-6">
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
          당신의 취향을 저격할 다양한 인테리어 스타일을 탐색해보세요.
        </p>

        {/* 카테고리 필터 */}
        <div className="no-scrollbar mb-6 flex gap-3 overflow-x-auto pb-2">
          <Chip label="전체" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
          {STYLE_TYPES.map((t) => (
            <Chip
              key={t}
              label={STYLE_LABELS[t]}
              active={filter === t}
              onClick={() => setFilter(t)}
            />
          ))}
        </div>

        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="rounded-xl bg-error-container p-stack-md text-on-error-container">
            <p className="font-label-md text-label-md">스타일 목록을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <section className="grid grid-cols-1 gap-gutter pb-8 sm:grid-cols-2">
            {items.map((it) => (
              <Link
                key={it.styleType}
                to={`/styles/${it.styleType}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-high transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${it.thumbnailUrl})` }}
                />
                <div className="absolute bottom-0 left-0 z-20 p-6">
                  <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-1 font-label-sm text-white backdrop-blur-md">
                    #{STYLE_LABELS[it.styleType]}
                  </span>
                  <h3 className="mb-1 font-headline-md text-headline-md text-white">{it.title}</h3>
                  <p className="font-body-sm text-white/70">{it.description}</p>
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <p className="col-span-full py-20 text-center font-body-md text-on-surface-variant">
                해당 스타일이 없습니다.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-6 py-2 font-label-md transition-all ${
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {label}
    </button>
  )
}
