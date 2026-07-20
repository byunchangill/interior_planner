// SPACE-004 도면 업로드 — docs/_22
// isFloorPlan=true 로 POST /spaces/{id}/photos. 드래그&드롭 + 클릭 선택, 20MB/형식 사전검증.
// 계약 사진 엔드포인트는 JPG/PNG만 허용하므로 PDF는 제외(원본 디자인의 PDF 칩 미표시).
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { uploadPhoto } from '../../api/space'
import { validateImageFile, uploadErrorMessage } from './fileGuard'
import Toast from '../../components/Toast'

export default function FloorPlanUploadPage() {
  const { id = '' } = useParams()
  const spaceId = Number(id)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleFile(file: File) {
    const invalid = validateImageFile(file)
    if (invalid) return setToast(invalid)
    setUploading(true)
    try {
      await uploadPhoto(spaceId, file, true)
      setToast('도면을 업로드했습니다.')
      setTimeout(() => navigate(`/spaces/${spaceId}`, { replace: true }), 600)
    } catch (err) {
      setToast(uploadErrorMessage(err))
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bright pb-16">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-1 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">도면 업로드</h1>
      </header>

      <main className="px-margin-mobile pt-24">
        <section className="mb-8">
          <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            도면 업로드
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            평면도를 업로드하면 AI가 벽면·창문 위치를 인식해 더 정밀한 배치를 제안합니다.
          </p>
        </section>

        {/* 업로드 영역 */}
        <div
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container-lowest'
          }`}
        >
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-fixed">
            {uploading ? (
              <span className="material-symbols-outlined animate-spin text-5xl text-primary">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-5xl text-primary">cloud_upload</span>
            )}
          </div>
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">
            {uploading ? '업로드 중…' : '도면 파일을 선택하거나 드래그하세요'}
          </h3>
          <p className="mb-6 max-w-sm font-body-md text-on-surface-variant">
            평면도 이미지를 업로드하면 더 정밀한 가상 인테리어를 경험할 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-surface-container-high px-4 py-1.5 font-label-md text-label-md text-on-surface-variant">
              JPG
            </span>
            <span className="rounded-full bg-surface-container-high px-4 py-1.5 font-label-md text-label-md text-on-surface-variant">
              PNG
            </span>
            <span className="rounded-full bg-error-container px-4 py-1.5 font-label-md text-label-md text-on-error-container">
              최대 20MB
            </span>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-8 flex items-center gap-4 rounded-xl bg-surface-container-low p-5">
          <span className="material-symbols-outlined text-outline">info</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            업로드된 도면은 분석 이외의 용도로 사용되지 않으며 안전하게 보호됩니다.
          </p>
        </div>
      </main>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleFile(file)
        }}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
