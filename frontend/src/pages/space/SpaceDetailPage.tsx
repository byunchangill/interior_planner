// SPACE-007 공간 상세 — docs/_23
// GET /spaces/{id} 전체 표시(사진·치수·가구) + 각 수정 화면 진입 + 사진 삭제.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSpace, deletePhoto } from '../../api/space'
import { useFetch } from '../../hooks/useFetch'
import Toast from '../../components/Toast'
import {
  SPACE_TYPE_LABELS,
  CONFIDENCE_META,
  OPENING_TYPE_LABELS,
  WALL_LABELS,
  FURNITURE_TYPE_LABELS,
} from '../../types/space'

export default function SpaceDetailPage() {
  const { id = '' } = useParams()
  const spaceId = Number(id)
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const res = useFetch(() => getSpace(spaceId), [spaceId, reload])

  async function onDeletePhoto(photoId: number) {
    if (!window.confirm('이 사진을 삭제할까요?')) return
    try {
      await deletePhoto(spaceId, photoId)
      setReload((n) => n + 1)
    } catch {
      setToast('사진 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate('/spaces')}
          className="rounded-full p-1 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          {res.state === 'ok' ? res.data.name : '공간 상세'}
        </h1>
      </header>

      <main className="px-margin-mobile pt-6">
        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}

        {res.state === 'error' && (
          <div className="mt-6 rounded-2xl bg-surface-container-high p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">search_off</span>
            <p className="mt-2 font-label-md text-label-md text-on-surface">
              공간을 찾을 수 없습니다
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{res.message}</p>
            <button
              onClick={() => navigate('/spaces')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-md text-on-primary"
            >
              목록으로
            </button>
          </div>
        )}

        {res.state === 'ok' && (
          <div className="space-y-stack-lg pb-8">
            {/* 헤더 요약 */}
            <div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-primary">
                Analysis Dashboard
              </span>
              <h2 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {res.data.name}
              </h2>
              <p className="mt-1 font-body-md text-on-surface-variant">
                {SPACE_TYPE_LABELS[res.data.spaceType]} · 사진{' '}
                {res.data.photos.filter((p) => !p.isFloorPlan).length}장
              </p>
            </div>

            {/* 사진 */}
            <section className="space-y-stack-md">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">등록 사진</h3>
                <button
                  onClick={() => navigate(`/spaces/${spaceId}/photos`)}
                  className="flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                  사진 추가
                </button>
              </div>
              {res.data.photos.length === 0 ? (
                <button
                  onClick={() => navigate(`/spaces/${spaceId}/photos`)}
                  className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  <span className="font-label-md">사진을 등록해 AI 분석을 시작하세요</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {res.data.photos.map((p) => (
                    <div
                      key={p.photoId}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container"
                    >
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${p.url})` }}
                      />
                      {p.isFloorPlan && (
                        <span className="glass-card absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-primary">
                          도면
                        </span>
                      )}
                      <button
                        onClick={() => onDeletePhoto(p.photoId)}
                        aria-label="사진 삭제"
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate(`/spaces/${spaceId}/floorplan`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low py-3 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                도면 업로드
              </button>
            </section>

            {/* 치수 요약 */}
            <section className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">공간 치수</h3>
                <span className="material-symbols-outlined text-on-surface-variant">straighten</span>
              </div>
              {res.data.dimensions ? (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${CONFIDENCE_META[res.data.dimensions.confidence].cls}`}
                    >
                      AI 신뢰도 {CONFIDENCE_META[res.data.dimensions.confidence].label}
                    </span>
                    {res.data.dimensions.isUserVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-[12px] font-bold text-on-secondary-container">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        사용자 확인
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                    <span className="font-medium text-on-surface-variant">전체 면적</span>
                    <span className="font-headline-md text-headline-md font-bold text-on-surface">
                      {res.data.dimensions.areaPyeong}
                      <span className="ml-1 font-body-sm text-body-sm font-normal text-on-surface-variant">
                        평
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <DimBox label="가로" value={res.data.dimensions.widthM} />
                    <DimBox label="세로" value={res.data.dimensions.depthM} />
                    <DimBox label="천장고" value={res.data.dimensions.heightM} />
                  </div>
                  {res.data.dimensions.openings.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {res.data.dimensions.openings.map((o) => (
                        <span
                          key={o.openingId}
                          className="rounded-lg bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"
                        >
                          {OPENING_TYPE_LABELS[o.type]} · {WALL_LABELS[o.wall]} {o.widthM}m
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="py-4 text-center font-body-sm text-body-sm text-on-surface-variant">
                  사진을 등록하면 AI가 치수를 추정합니다.
                </p>
              )}
            </section>

            {/* 가구 목록 */}
            <section className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">기존 가구</h3>
                <button
                  onClick={() => navigate(`/spaces/${spaceId}/edit`)}
                  className="flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  수정
                </button>
              </div>
              {res.data.furniture.length === 0 ? (
                <p className="py-4 text-center font-body-sm text-body-sm text-on-surface-variant">
                  등록된 가구가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {res.data.furniture.map((f) => (
                    <div
                      key={f.furnitureId}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.keep ? 'bg-primary-container/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">chair</span>
                        </span>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{f.label}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {FURNITURE_TYPE_LABELS[f.type]}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-label-sm text-label-sm ${f.keep ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
                      >
                        {f.keep ? '유지 희망' : '제외 예정'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 액션 */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => navigate(`/spaces/${spaceId}/edit`)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-primary font-label-md text-label-md text-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">edit_square</span>
                치수 · 가구 수정하기
              </button>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function DimBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
      <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-body-lg text-body-lg font-bold text-on-surface">{value}m</p>
    </div>
  )
}
