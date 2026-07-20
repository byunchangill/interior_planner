// SPACE-003 사진 촬영 가이드 — docs/_3
// 웹 환경: 카메라 촬영(<input capture>) / 앨범 선택(<input>) → POST /spaces/{id}/photos (multipart).
// 촬영 가이드 오버레이 + 좋은/나쁜 예 + 업로드 썸네일. 최초 사진 업로드 후 치수 확인(SPACE-005)로.
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { uploadPhoto } from '../../api/space'
import { validateImageFile, uploadErrorMessage } from './fileGuard'
import Toast from '../../components/Toast'
import type { Photo } from '../../types/space'

export default function SpacePhotoPage() {
  const { id = '' } = useParams()
  const spaceId = Number(id)
  const navigate = useNavigate()
  const cameraRef = useRef<HTMLInputElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 허용
    if (!file) return

    const invalid = validateImageFile(file)
    if (invalid) return setToast(invalid)

    setUploading(true)
    try {
      const res = await uploadPhoto(spaceId, file, false)
      setPhotos((p) => [...p, { photoId: res.photoId, url: res.url, isFloorPlan: false }])
      if (res.detectedFurniture.length > 0) {
        setToast(`AI가 가구 ${res.detectedFurniture.length}개를 인식했어요.`)
      } else {
        setToast('사진을 등록했습니다.')
      }
    } catch (err) {
      setToast(uploadErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900 text-white">
      {/* 배경(카메라 프리뷰 대체 플레이스홀더) */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-neutral-800 to-neutral-950" />

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-margin-mobile pb-8 pt-6">
        {/* 상단 바 */}
        <header className="mt-2 flex items-center justify-between">
          <button
            onClick={() => navigate(`/spaces/${spaceId}`)}
            className="glass-card flex h-10 w-10 items-center justify-center rounded-full text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="glass-card flex items-center gap-2 rounded-full px-4 py-2">
            <span
              className="material-symbols-outlined text-primary-fixed-dim"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              light_mode
            </span>
            <span className="font-label-md text-label-md text-white">사진 촬영 가이드</span>
          </div>
          <div className="h-10 w-10" />
        </header>

        {/* 중앙 정렬 가이드 */}
        <main className="pointer-events-none relative flex flex-grow items-center justify-center py-8">
          <div className="relative aspect-[4/3] w-full max-w-sm">
            <div className="absolute left-0 top-0 h-14 w-14 rounded-tl-xl border-l-4 border-t-4 border-primary-container" />
            <div className="absolute right-0 top-0 h-14 w-14 rounded-tr-xl border-r-4 border-t-4 border-primary-container" />
            <div className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-xl border-b-4 border-l-4 border-primary-container" />
            <div className="absolute bottom-0 right-0 h-14 w-14 rounded-br-xl border-b-4 border-r-4 border-primary-container" />
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <div className="glass-card rounded-xl border-primary-container/30 p-4 text-center shadow-xl">
                <p className="font-label-md text-label-md text-primary-fixed">TIP</p>
                <p className="mt-1 font-body-md text-body-md leading-tight text-white">
                  공간의 모서리가 잘 보이도록 넓은 각도에서 촬영해 주세요
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* 하단: 가이드 카드 + 업로드 컨트롤 */}
        <footer className="flex flex-col gap-stack-lg">
          <div className="grid grid-cols-1 gap-stack-md">
            <GuideCard
              icon="info"
              tone="bg-primary-container"
              title="촬영 가이드"
              body="공간 전체가 보이도록 구석에서 1.5m 이상 거리를 두고 찍어주세요."
            />
            <GuideCard
              icon="wb_sunny"
              tone="bg-secondary"
              title="채광 확인"
              body="조명을 켜고 낮에 찍으면 분석 결과가 더 정확해요."
            />
          </div>

          {/* 업로드된 썸네일 */}
          {photos.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {photos.map((p) => (
                <div
                  key={p.photoId}
                  className="h-16 w-16 flex-none overflow-hidden rounded-lg border-2 border-emerald-500 bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.url})` }}
                />
              ))}
            </div>
          )}

          {/* 촬영/앨범/도면 컨트롤 */}
          <div className="flex items-center justify-between gap-4">
            {/* 앨범 선택 */}
            <button
              onClick={() => albumRef.current?.click()}
              disabled={uploading}
              className="glass-card flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl text-white disabled:opacity-50"
            >
              <span className="material-symbols-outlined">image</span>
              <span className="font-label-sm text-[10px]">앨범</span>
            </button>

            {/* 셔터(카메라 촬영) */}
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="group relative disabled:opacity-60"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform group-active:scale-90">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                  {uploading ? (
                    <span className="material-symbols-outlined animate-spin text-primary">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-primary">photo_camera</span>
                  )}
                </div>
              </div>
            </button>

            {/* 도면 업로드 진입 */}
            <button
              onClick={() => navigate(`/spaces/${spaceId}/floorplan`)}
              className="glass-card flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl text-white"
            >
              <span className="material-symbols-outlined">description</span>
              <span className="font-label-sm text-[10px]">도면</span>
            </button>
          </div>

          {/* 다음 단계 */}
          <button
            onClick={() => navigate(`/spaces/${spaceId}/edit`)}
            disabled={photos.length === 0}
            className="h-14 w-full rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50 disabled:shadow-none"
          >
            치수 확인하기
          </button>
        </footer>
      </div>

      {/* 숨김 파일 입력: 카메라(capture) / 앨범 */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
      <input ref={albumRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function GuideCard({
  icon,
  tone,
  title,
  body,
}: {
  icon: string
  tone: string
  title: string
  body: string
}) {
  return (
    <div className="glass-card flex items-start gap-4 rounded-2xl p-stack-md shadow-lg">
      <div className={`shrink-0 rounded-lg p-2 ${tone}`}>
        <span
          className="material-symbols-outlined text-white"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <h3 className="mb-1 font-label-md text-label-md text-white">{title}</h3>
        <p className="font-body-sm text-body-sm text-white/90">{body}</p>
      </div>
    </div>
  )
}
