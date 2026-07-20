// SAVE-001 저장된 추천 목록(보관함) — docs/_6
// GET /saved 목록. 카드별: 이 안으로 결정(PUT select) · 공유 · 구매목록 · 저장 해제(DELETE) · 비교 선택(2~3개)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSaved, unsave, select } from '../api/save'
import type { SavedItem } from '../types/save'
import { STYLE_GRADIENTS } from '../types/reco'
import { STYLE_LABELS } from '../types/home'
import { formatWon, formatDate } from '../utils/format'
import Toast from '../components/Toast'

const MAX_COMPARE = 3

export default function SavedPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<SavedItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')

  useEffect(() => {
    getSaved()
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  function togglePick(id: number) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size >= MAX_COMPARE) {
        setToast(`비교는 최대 ${MAX_COMPARE}개까지 가능해요`)
        return prev
      } else next.add(id)
      return next
    })
  }

  async function onUnsave(id: number) {
    try {
      await unsave(id)
      setItems((prev) => prev?.filter((s) => s.recommendationId !== id) ?? null)
      setPicked((prev) => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
      setToast('보관함에서 해제했어요')
    } catch (e) {
      setToast(e instanceof Error ? e.message : '해제 실패')
    }
  }

  async function onSelect(item: SavedItem) {
    try {
      await select(item.recommendationId)
      // 같은 공간 단일 대표: 같은 spaceId 중 이 안만 selected
      setItems(
        (prev) =>
          prev?.map((s) =>
            s.spaceId === item.spaceId
              ? { ...s, selected: s.recommendationId === item.recommendationId }
              : s,
          ) ?? null,
      )
      setToast('이 안으로 결정했어요')
    } catch (e) {
      setToast(e instanceof Error ? e.message : '결정 실패')
    }
  }

  function onCompare() {
    if (picked.size < 2) {
      setToast('비교할 추천안을 2개 이상 선택하세요')
      return
    }
    navigate(`/saved/compare?ids=${[...picked].join(',')}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* TopAppBar */}
      <header className="fixed top-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 items-center justify-between bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">보관함</h1>
      </header>

      <main className="px-margin-mobile pt-20">
        {/* 탭 (위시리스트는 P3 — 안내만) */}
        <div className="mb-6 flex border-b border-outline-variant">
          <button className="flex-1 border-b-2 border-primary py-4 font-label-md text-label-md text-primary">
            저장된 추천
          </button>
          <button
            onClick={() => setToast('위시리스트는 준비 중이에요')}
            className="flex-1 border-b-2 border-transparent py-4 font-label-md text-label-md text-on-surface-variant"
          >
            위시리스트
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">보관함을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{error}</p>
          </div>
        )}

        {!items && !error && (
          <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}

        {items && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant">inventory_2</span>
            <p className="font-body-md text-on-surface-variant">아직 저장한 추천안이 없어요</p>
            <button
              onClick={() => navigate('/reco')}
              className="mt-2 rounded-full bg-primary px-6 py-3 font-label-md text-label-md text-on-primary active:scale-95"
            >
              추천 받으러 가기
            </button>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="space-y-6 pb-40">
            {items.map((item) => (
              <SavedCard
                key={item.recommendationId}
                item={item}
                picked={picked.has(item.recommendationId)}
                onTogglePick={() => togglePick(item.recommendationId)}
                onOpen={() => navigate(`/reco/${item.recommendationId}`)}
                onSelect={() => onSelect(item)}
                onShare={() => navigate(`/reco/${item.recommendationId}/share`)}
                onShopping={() => navigate(`/reco/${item.recommendationId}/shopping-list`)}
                onUnsave={() => onUnsave(item.recommendationId)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 비교 FAB */}
      {picked.size >= 1 && (
        <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-margin-mobile">
          <button
            onClick={onCompare}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-on-primary shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined">compare_arrows</span>
            <span className="font-label-md text-label-md">{picked.size}개 선택하여 비교하기</span>
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

interface CardProps {
  item: SavedItem
  picked: boolean
  onTogglePick: () => void
  onOpen: () => void
  onSelect: () => void
  onShare: () => void
  onShopping: () => void
  onUnsave: () => void
}

function SavedCard({
  item,
  picked,
  onTogglePick,
  onOpen,
  onSelect,
  onShare,
  onShopping,
  onUnsave,
}: CardProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border bg-surface-container-lowest shadow-sm transition-all',
        picked ? 'border-primary bg-surface-container-low' : 'border-outline-variant',
      ].join(' ')}
    >
      {/* 비교 선택 체크박스 */}
      <button
        onClick={onTogglePick}
        aria-label="비교 선택"
        className={[
          'absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all',
          picked ? 'border-primary bg-primary' : 'border-outline-variant bg-white',
        ].join(' ')}
      >
        {picked && <span className="material-symbols-outlined text-sm text-white">check</span>}
      </button>

      {/* 대표 배지 */}
      {item.selected && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span className="text-[10px] font-bold">대표</span>
        </div>
      )}

      {/* 대표 이미지 */}
      <button onClick={onOpen} className="block w-full text-left">
        <div className="aspect-[16/10] w-full overflow-hidden" style={{ background: STYLE_GRADIENTS[item.style] }}>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.conceptTitle} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-white/70">chair</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <span className="rounded-md bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase text-on-secondary-container">
              {item.spaceName} · {STYLE_LABELS[item.style]}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{formatDate(item.savedAt)}</span>
          </div>
          <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">{item.conceptTitle}</h3>
          <div className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
            <span>예산 {formatWon(item.budgetTotal)}</span>
            <span className="text-outline-variant">·</span>
            <span>적합도 {item.fitScoreTotal}점</span>
          </div>
        </div>
      </button>

      {/* 액션 바 */}
      <div className="grid grid-cols-4 divide-x divide-outline-variant/50 border-t border-outline-variant/50">
        <CardAction icon="check_circle" label="결정" onClick={onSelect} highlight={item.selected} />
        <CardAction icon="share" label="공유" onClick={onShare} />
        <CardAction icon="shopping_cart" label="구매목록" onClick={onShopping} />
        <CardAction icon="bookmark_remove" label="해제" onClick={onUnsave} danger />
      </div>
    </div>
  )
}

function CardAction({
  icon,
  label,
  onClick,
  highlight = false,
  danger = false,
}: {
  icon: string
  label: string
  onClick: () => void
  highlight?: boolean
  danger?: boolean
}) {
  const color = danger ? 'text-error' : highlight ? 'text-primary' : 'text-on-surface-variant'
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 transition-colors hover:bg-surface-container-low ${color}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="font-label-sm text-[11px]">{label}</span>
    </button>
  )
}
