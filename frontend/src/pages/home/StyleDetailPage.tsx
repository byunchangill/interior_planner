// HOME-003 스타일 상세 — docs/_7, _19
// GET /styles/{styleType}: 히어로 + 컨셉 설명 + 키워드 + 갤러리.
// 계약이 title/description/keywords/gallery만 제공하므로 _7의 다단 섹션 대신 핵심만 구성.
import { useNavigate, useParams } from 'react-router-dom'
import { getStyleDetail } from '../../api/home'
import { useFetch } from '../../hooks/useFetch'

export default function StyleDetailPage() {
  const { styleType = '' } = useParams()
  const navigate = useNavigate()
  const res = useFetch(() => getStyleDetail(styleType), [styleType])

  const hero = res.state === 'ok' ? res.data.gallery[0] : undefined

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface/80 px-5 py-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          {res.state === 'ok' ? res.data.title : '스타일 상세'}
        </h1>
      </header>

      <main className="px-5 pt-6">
        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}

        {res.state === 'error' && (
          <div className="mt-6 rounded-2xl bg-surface-container-high p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">search_off</span>
            <p className="mt-2 font-label-md text-label-md text-on-surface">
              스타일을 찾을 수 없습니다
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{res.message}</p>
            <button
              onClick={() => navigate('/styles')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-md text-on-primary"
            >
              갤러리로 돌아가기
            </button>
          </div>
        )}

        {res.state === 'ok' && (
          <div className="space-y-8 pb-10">
            {/* 히어로 */}
            <section>
              <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-3xl bg-surface-container-high shadow-lg">
                {hero && (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${hero.imageUrl})` }}
                  />
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-8">
                  <span className="mb-3 w-fit rounded-full bg-secondary px-3 py-1 font-label-sm text-label-sm text-on-secondary">
                    AI 추천 스타일
                  </span>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-white">
                    {res.data.title}
                  </h2>
                </div>
              </div>

              {/* 컨셉 설명 */}
              <div className="space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold text-primary">
                  컨셉 설명
                </h3>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  {res.data.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {res.data.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-lg bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface-variant"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 갤러리 */}
            {res.data.gallery.length > 0 && (
              <section className="space-y-4">
                <h3 className="font-headline-md text-headline-md font-bold">스타일 갤러리</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {res.data.gallery.map((g, i) => (
                    <figure
                      key={i}
                      className="overflow-hidden rounded-2xl border border-outline-variant bg-white"
                    >
                      <div
                        className="aspect-[4/3] w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${g.imageUrl})` }}
                      />
                      <figcaption className="p-4 font-label-md text-label-md text-on-surface-variant">
                        {g.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* 고지 */}
            <div className="flex items-center gap-4 rounded-2xl bg-surface-container-high p-6">
              <span className="material-symbols-outlined text-3xl text-primary">info</span>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  본 제안은 HomeStyler AI 분석 결과로 실제와 다를 수 있습니다.
                </p>
                <p className="mt-1 font-body-sm text-xs text-outline">
                  실제 치수와 채광 조건에 따라 전문가 상담을 권장합니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
