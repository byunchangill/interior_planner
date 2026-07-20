// MY-002 데이터·개인정보 관리 — docs/_12
// GET /me/images 원본 목록(공간별) → 개별/전체 선택 삭제 DELETE /me/images.
// 삭제 확인 다이얼로그(대상 개수, 복구 불가, keepResults 토글) 필수.
// SHARE_002 → 공유링크 회수 확인 후 confirmShareRevoke=true 재요청. AI_005 안내.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImages, deleteImages } from '../../api/my'
import { apiErrorCode } from '../../api/client'
import { ERR, type UploadedImage } from '../../types/my'
import { formatDate } from '../../utils/format'
import Toast from '../../components/Toast'

// 삭제 대상 지정: 전체 or 선택된 photoId 목록
type Target = { deleteAll: true } | { deleteAll: false; imageIds: number[] }

export default function DataPrivacyPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [keepResults, setKeepResults] = useState(true)
  const [toast, setToast] = useState('')

  // 다이얼로그: null(닫힘) | 'confirm'(1차 확인) | 'share'(공유링크 회수 확인)
  const [dialog, setDialog] = useState<null | 'confirm' | 'share'>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [deleting, setDeleting] = useState(false)

  function load() {
    setLoading(true)
    getImages()
      .then((items) => {
        setImages(items)
        setSelected(new Set())
      })
      .catch(() => setToast('원본 목록을 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  // 공간별 그룹
  const groups = useMemo(() => {
    const map = new Map<number, { spaceName: string; items: UploadedImage[] }>()
    for (const img of images) {
      const g = map.get(img.spaceId) ?? { spaceName: img.spaceName, items: [] }
      g.items.push(img)
      map.set(img.spaceId, g)
    }
    return [...map.values()]
  }, [images])

  const allSelected = images.length > 0 && selected.size === images.length

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(images.map((i) => i.photoId)))
  }

  function openConfirm(t: Target) {
    setTarget(t)
    setDialog('confirm')
  }

  const targetCount = !target ? 0 : target.deleteAll ? images.length : target.imageIds.length

  // 실제 삭제 요청. confirmShareRevoke는 share 단계에서 true.
  async function runDelete(confirmShareRevoke: boolean) {
    if (!target) return
    setDeleting(true)
    try {
      const res = await deleteImages({
        deleteAll: target.deleteAll,
        imageIds: target.deleteAll ? undefined : target.imageIds,
        keepResults,
        confirmShareRevoke,
      })
      setDialog(null)
      setTarget(null)
      const extra =
        res.revokedShareLinks > 0 ? ` · 공유링크 ${res.revokedShareLinks}건 회수` : ''
      const reco =
        res.deletedRecommendations > 0 ? ` · 추천안 ${res.deletedRecommendations}건 삭제` : ''
      setToast(`원본 ${res.deletedCount}건 삭제 완료${extra}${reco}`)
      load()
    } catch (e) {
      const code = apiErrorCode(e)
      if (code === ERR.SHARE_002) {
        // 원본 포함 공유링크 존재 → 회수 확인 단계로 전환
        setDialog('share')
      } else if (code === ERR.AI_005) {
        setDialog(null)
        setToast('분석이 진행 중인 공간이 있어 삭제할 수 없어요. 완료 후 다시 시도해 주세요.')
      } else if (code === ERR.AUTH_003) {
        setDialog(null)
        setToast('본인의 원본만 삭제할 수 있어요.')
      } else {
        setDialog(null)
        setToast('삭제에 실패했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">데이터·개인정보</h1>
      </header>

      <main className="px-margin-mobile pt-24">
        {/* 보안 강조 히어로 */}
        <section className="mb-stack-lg">
          <div className="glass-card flex items-start gap-4 rounded-xl border-l-4 border-primary p-5">
            <div className="rounded-full bg-primary/10 p-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <div>
              <h2 className="mb-1 font-headline-md text-[18px] text-on-surface">데이터 주권 보호</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                업로드한 원본 사진·도면은 원할 때 언제든 완전 삭제할 수 있어요. 삭제 시 스토리지에서 즉시 파기됩니다.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="py-20 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        ) : images.length === 0 ? (
          <div className="rounded-2xl bg-surface-container p-8 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant">folder_open</span>
            <p className="font-body-md text-body-md text-on-surface-variant">업로드한 원본이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 선택 컨트롤 */}
            <div className="mb-stack-md flex items-center justify-between">
              <h3 className="font-headline-md text-[18px]">
                업로드한 원본 <span className="ml-1 font-body-md text-body-md font-normal text-primary">{images.length}개</span>
              </h3>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-label-md text-label-md text-primary hover:bg-primary-container/40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {allSelected ? 'check_box' : 'check_box_outline_blank'}
                </span>
                전체 선택
              </button>
            </div>

            {/* 공간별 그리드 */}
            <div className="space-y-stack-lg">
              {groups.map((g) => (
                <section key={g.spaceName}>
                  <h4 className="mb-stack-sm px-1 font-label-md text-label-md text-on-surface-variant">{g.spaceName}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {g.items.map((img) => {
                      const isSel = selected.has(img.photoId)
                      return (
                        <button
                          key={img.photoId}
                          onClick={() => toggle(img.photoId)}
                          className={[
                            'relative overflow-hidden rounded-xl border bg-surface-container-lowest text-left shadow-sm transition-all',
                            isSel ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant',
                          ].join(' ')}
                        >
                          {/* 원본 썸네일: 만료 위험 원격 URL → 아이콘 플레이스홀더 */}
                          <div className="flex aspect-square items-center justify-center bg-surface-container-high">
                            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                              {img.isFloorPlan ? 'architecture' : 'image'}
                            </span>
                          </div>
                          {/* 선택 체크 표시 */}
                          <div
                            className={[
                              'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                              isSel ? 'border-primary bg-primary text-on-primary' : 'border-white/80 bg-black/30 text-transparent',
                            ].join(' ')}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </div>
                          <div className="p-3">
                            <div className="mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                lock
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-tighter text-secondary">
                                {img.isFloorPlan ? '도면' : '사진'}
                              </span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant">{formatDate(img.uploadedAt)}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {/* 하단 삭제 액션 바 */}
      {!loading && images.length > 0 && (
        <footer className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-outline-variant bg-surface p-margin-mobile shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3">
            <button
              onClick={() => openConfirm({ deleteAll: false, imageIds: [...selected] })}
              disabled={selected.size === 0}
              className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full border border-error font-label-md text-label-md text-error transition-all active:scale-95 disabled:border-outline-variant disabled:text-on-surface-variant disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              선택 삭제{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
            <button
              onClick={() => openConfirm({ deleteAll: true })}
              className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full bg-error font-label-md text-label-md text-on-error shadow-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              원본 전체 삭제
            </button>
          </div>
        </footer>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-2xl sm:rounded-2xl">
            {dialog === 'confirm' && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">원본 {targetCount}건 삭제</h3>
                </div>
                <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
                  선택한 원본 사진·도면을 스토리지에서 즉시 파기합니다.
                  <span className="font-semibold text-error"> 삭제 후 복구가 불가능</span>합니다.
                </p>

                {/* keepResults 토글 */}
                <div className="mb-6 flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div className="pr-3">
                    <p className="font-label-md text-label-md text-on-surface">추천 결과는 남기기</p>
                    <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                      {keepResults
                        ? '원본만 삭제하고 추천안·AI 생성 이미지는 유지해요.'
                        : '원본과 함께 연결된 추천안·공유링크까지 삭제해요.'}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={keepResults}
                      onChange={(e) => setKeepResults(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={deleting}
                    className="h-12 flex-1 rounded-xl bg-surface-container-highest font-label-md text-label-md text-on-surface transition-all active:scale-95"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => runDelete(false)}
                    disabled={deleting}
                    className="h-12 flex-1 rounded-xl bg-error font-label-md text-label-md text-on-error transition-all active:scale-95 disabled:opacity-60"
                  >
                    {deleting ? '삭제 중…' : '삭제하기'}
                  </button>
                </div>
              </>
            )}

            {dialog === 'share' && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">link_off</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">공유 링크 회수 확인</h3>
                </div>
                <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
                  삭제하려는 원본이 포함된 공유 링크가 있어요. 계속하면{' '}
                  <span className="font-semibold text-error">원본 포함 공유 링크가 회수</span>되어 더 이상 열람할 수 없습니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDialog('confirm')}
                    disabled={deleting}
                    className="h-12 flex-1 rounded-xl bg-surface-container-highest font-label-md text-label-md text-on-surface transition-all active:scale-95"
                  >
                    뒤로
                  </button>
                  <button
                    onClick={() => runDelete(true)}
                    disabled={deleting}
                    className="h-12 flex-1 rounded-xl bg-error font-label-md text-label-md text-on-error transition-all active:scale-95 disabled:opacity-60"
                  >
                    {deleting ? '처리 중…' : '회수하고 삭제'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
