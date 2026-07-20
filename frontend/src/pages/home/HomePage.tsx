// HOME-001 홈 — docs/_1
// GET /home/summary: 인사말 + 최근 공간 + 스타일 하이라이트.
import { Link, useNavigate } from 'react-router-dom'
import { getHomeSummary } from '../../api/home'
import { useFetch } from '../../hooks/useFetch'
import { STYLE_LABELS, STYLE_GRADIENT } from '../../types/home'

export default function HomePage() {
  const navigate = useNavigate()
  const res = useFetch(getHomeSummary)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">HomeStyler</h1>
        <button className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-low">
          notifications
        </button>
      </header>

      <main className="px-margin-mobile pt-6">
        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}

        {res.state === 'error' && (
          <div className="mt-6 rounded-xl bg-error-container p-stack-md text-on-error-container">
            <p className="font-label-md text-label-md">홈 데이터를 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <>
            {/* 인사말 */}
            <section className="mb-stack-lg">
              <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                반가워요, {res.data.nickname}님!
                <br />
                오늘은 어떤 공간을 바꿔볼까요?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                AI가 당신의 취향에 딱 맞는 스타일을 찾아드려요.
              </p>
            </section>

            {/* 메인 CTA */}
            <section className="mb-stack-lg">
              <div className="relative overflow-hidden rounded-xl bg-primary-container p-8 shadow-sm">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 font-label-sm text-white backdrop-blur-sm">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  AI 인테리어 리포트
                </span>
                <h3 className="mb-6 font-headline-md text-headline-md text-white">
                  공간 사진 한 장으로 시작하는
                  <br />
                  나만의 스타일 분석
                </h3>
                <button
                  onClick={() => navigate('/reco')}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-label-md text-on-primary shadow-lg transition-transform active:scale-95"
                >
                  맞춤형 인테리어 분석 시작
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </section>

            {/* 내 공간 요약 */}
            <section className="mb-stack-lg">
              <div className="mb-stack-md flex items-center justify-between">
                <h3 className="font-label-md text-on-surface">내 공간 요약</h3>
                <Link to="/spaces" className="font-label-sm text-primary">
                  전체보기
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {res.data.recentSpaces.length === 0 && (
                  <Link
                    to="/spaces"
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant p-4 font-label-md text-on-surface-variant transition-colors hover:bg-surface-container-highest"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    새 공간 등록하기
                  </Link>
                )}
                {res.data.recentSpaces.map((sp) => (
                  <Link
                    key={sp.spaceId}
                    to={`/spaces/${sp.spaceId}`}
                    className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3"
                  >
                    <div
                      className="h-12 w-12 flex-none rounded-lg bg-surface-container-high bg-cover bg-center"
                      style={{ backgroundImage: `url(${sp.thumbnailUrl})` }}
                    />
                    <div>
                      <p className="font-label-md text-on-surface">{sp.name}</p>
                      <p className="font-label-sm text-on-surface-variant">최근 등록한 공간</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 스타일 하이라이트 */}
            <section className="mb-stack-lg">
              <div className="mb-stack-md flex items-end justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  스타일 갤러리 미리보기
                </h3>
                <Link to="/styles" className="font-label-sm text-primary">
                  전체보기
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {res.data.styleHighlights.map((s) => (
                  <Link
                    key={s.styleType}
                    to={`/styles/${s.styleType}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-surface-container-high"
                  >
                    <div
                      className={`h-full w-full transition-transform duration-500 group-hover:scale-110 ${STYLE_GRADIENT[s.styleType]}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="font-label-md text-white">{s.title}</p>
                      <p className="font-label-sm text-white/70">
                        #{STYLE_LABELS[s.styleType]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
