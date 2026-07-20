// SPACE-001 내 공간 목록 — docs/_18
// GET /spaces: 공간 카드 목록 + "공간 추가" 진입 + 삭제(DELETE /spaces/{id}).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSpaces, deleteSpace } from '../../api/space'
import { useFetch } from '../../hooks/useFetch'
import Toast from '../../components/Toast'
import { SPACE_TYPE_LABELS, SPACE_TYPE_ICONS, type SpaceListItem } from '../../types/space'

export default function SpaceListPage() {
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const res = useFetch(getSpaces, [reload])

  async function onDelete(sp: SpaceListItem) {
    if (!window.confirm(`'${sp.name}' 공간을 삭제할까요? 등록된 사진도 함께 삭제됩니다.`)) return
    try {
      await deleteSpace(sp.spaceId)
      setToast('공간을 삭제했습니다.')
      setReload((n) => n + 1)
    } catch {
      setToast('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">내 공간</h1>
        <button
          onClick={() => navigate('/spaces/new')}
          className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          공간 추가
        </button>
      </header>

      <main className="px-margin-mobile pt-6">
        <div className="mb-stack-md flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home
          </span>
          <span className="font-label-md text-label-md text-primary">나의 거주 공간</span>
        </div>

        {res.state === 'loading' && (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}

        {res.state === 'error' && (
          <div className="mt-6 rounded-xl bg-error-container p-stack-md text-on-error-container">
            <p className="font-label-md text-label-md">공간 목록을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <div className="grid grid-cols-1 gap-gutter pb-8">
            {res.data.map((sp) => (
              <SpaceCard key={sp.spaceId} sp={sp} onDelete={() => onDelete(sp)} />
            ))}

            {/* 새 공간 추가 플레이스홀더 */}
            <button
              onClick={() => navigate('/spaces/new')}
              className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-outline-variant/50 bg-surface-container-low p-6 transition-all hover:border-primary/50 hover:bg-surface-container-high"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl text-primary">add</span>
              </div>
              <div className="text-center">
                <p className="font-label-md font-bold text-on-surface">새로운 공간 추가</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  사진을 찍거나 업로드하세요
                </p>
              </div>
            </button>
          </div>
        )}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function SpaceCard({ sp, onDelete }: { sp: SpaceListItem; onDelete: () => void }) {
  const analyzed = sp.photoCount > 0
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm transition-all hover:shadow-xl">
      <Link to={`/spaces/${sp.spaceId}`} className="relative block h-48 overflow-hidden">
        {sp.thumbnailUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${sp.thumbnailUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
            <span className="material-symbols-outlined text-5xl text-outline-variant">
              {SPACE_TYPE_ICONS[sp.spaceType]}
            </span>
          </div>
        )}
        <div className="glass-card absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1">
          <span
            className={`material-symbols-outlined text-[18px] ${analyzed ? 'text-primary' : 'text-outline'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {analyzed ? 'auto_awesome' : 'pending'}
          </span>
          <span className={`text-[12px] font-bold ${analyzed ? 'text-primary' : 'text-outline'}`}>
            {analyzed ? 'AI 분석 완료' : '분석 전'}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{sp.name}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {SPACE_TYPE_LABELS[sp.spaceType]}
            </p>
          </div>
          <button
            onClick={onDelete}
            aria-label="공간 삭제"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between font-label-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">photo_library</span>
            <span>등록 사진</span>
          </div>
          <span className="font-bold text-on-surface">{sp.photoCount}장</span>
        </div>
      </div>
    </div>
  )
}
