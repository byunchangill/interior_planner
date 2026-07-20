// SAVE-003 공유하기 — docs/_13 ("Share Recommendation" 한글화)
// 공유 링크 생성(만료 D7/D30/NONE, 원본 사진 포함 토글+경고), 링크 목록/회수, 복사/공유
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createShareLink, getShareLinks, revokeShareLink } from '../../api/save'
import type { ShareExpiry, ShareLink } from '../../types/save'
import { SHARE_EXPIRY_OPTIONS } from '../../types/save'
import { formatDate } from '../../utils/format'
import Toast from '../../components/Toast'

function absUrl(shareUrl: string): string {
  return `${window.location.origin}${shareUrl}`
}

export default function SharePage() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const recoId = Number(recommendationId)

  const [expiresIn, setExpiresIn] = useState<ShareExpiry>('D30')
  const [includePhotos, setIncludePhotos] = useState(false)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getShareLinks(recoId)
      .then(setLinks)
      .catch(() => setLinks([]))
  }, [recoId])

  async function onCreate() {
    setCreating(true)
    try {
      const created = await createShareLink(recoId, expiresIn, includePhotos)
      // 목록 갱신
      const fresh = await getShareLinks(recoId).catch(() => links)
      setLinks(fresh)
      await copy(created.shareUrl)
      setToast('공유 링크를 만들고 복사했어요')
    } catch (e) {
      setToast(e instanceof Error ? e.message : '링크 생성 실패')
    } finally {
      setCreating(false)
    }
  }

  async function copy(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(absUrl(shareUrl))
    } catch {
      /* 클립보드 미지원 시 무시 — 사용자가 직접 선택 복사 */
    }
  }

  async function onCopy(shareUrl: string) {
    await copy(shareUrl)
    setToast('링크를 복사했어요')
  }

  async function onShare(shareUrl: string) {
    const url = absUrl(shareUrl)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'HomeStyler 추천', url })
        return
      } catch {
        /* 취소/미지원 → 복사로 폴백 */
      }
    }
    await onCopy(shareUrl)
  }

  async function onRevoke(linkId: number) {
    try {
      await revokeShareLink(linkId)
      setLinks((prev) => prev.map((l) => (l.linkId === linkId ? { ...l, revoked: true } : l)))
      setToast('링크를 회수했어요')
    } catch (e) {
      setToast(e instanceof Error ? e.message : '회수 실패')
    }
  }

  const activeLinks = links.filter((l) => !l.revoked)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="닫기">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">공유하기</h1>
      </header>

      <main className="flex-grow space-y-stack-md px-margin-mobile pt-20 pb-16">
        <p className="px-1 font-body-sm text-body-sm text-on-surface-variant">
          앱이 없는 사용자도 웹페이지로 추천 내용을 확인할 수 있어요. (조회 전용)
        </p>

        {/* 링크 설정 카드 */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 font-label-md text-label-md">
            <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
            링크 설정
          </h4>

          {/* 만료 기간 */}
          <div className="mb-6">
            <p className="mb-3 font-label-sm text-label-sm text-on-surface-variant">만료 기간 설정</p>
            <div className="flex gap-2">
              {SHARE_EXPIRY_OPTIONS.map((opt) => {
                const active = opt.value === expiresIn
                return (
                  <button
                    key={opt.value}
                    onClick={() => setExpiresIn(opt.value)}
                    className={[
                      'flex-1 rounded-lg border py-2 font-label-md text-label-md transition-all active:scale-95',
                      active
                        ? 'border-primary bg-primary-container text-on-primary-container'
                        : 'border-outline-variant text-on-surface-variant',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 원본 사진 포함 토글 */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 py-4">
            <div className="pr-3">
              <p className="font-body-md font-semibold text-on-surface">원본 사진 포함</p>
              {includePhotos ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-error">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  개인 공간 사진이 링크를 아는 누구에게나 공개됩니다.
                </p>
              ) : (
                <p className="mt-1 text-xs text-on-surface-variant">개인정보 보호를 위해 신중히 선택하세요.</p>
              )}
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>

          <button
            onClick={onCreate}
            disabled={creating}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-label-md text-label-md text-on-primary active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-[20px]">add_link</span>
            {creating ? '생성 중…' : '공유 링크 만들기'}
          </button>
        </div>

        {/* 생성된 링크 목록 */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 font-label-md text-label-md">
            <span className="material-symbols-outlined text-[20px] text-primary">link</span>
            공유 중인 링크
          </h4>

          {activeLinks.length === 0 ? (
            <p className="py-4 text-center font-body-sm text-body-sm text-on-surface-variant">
              아직 생성한 링크가 없어요.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeLinks.map((l) => (
                <li key={l.linkId} className="rounded-lg border border-outline-variant/50 bg-surface-container p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
                    <span className="flex-grow truncate text-sm text-on-surface">{absUrl(l.shareUrl)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">
                      {l.expiresAt ? `${formatDate(l.expiresAt)} 만료` : '만료 없음'}
                    </span>
                    <div className="flex gap-1">
                      <IconBtn icon="content_copy" label="복사" onClick={() => onCopy(l.shareUrl)} />
                      <IconBtn icon="share" label="공유" onClick={() => onShare(l.shareUrl)} />
                      <IconBtn icon="link_off" label="회수" onClick={() => onRevoke(l.linkId)} danger />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

function IconBtn({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        'flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-sm text-label-sm transition-colors active:scale-95',
        danger ? 'text-error hover:bg-error-container/50' : 'text-primary hover:bg-primary-container/40',
      ].join(' ')}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  )
}
