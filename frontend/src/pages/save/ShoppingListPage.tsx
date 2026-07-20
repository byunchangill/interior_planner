// 구매목록 내보내기 — GET /recommendations/{id}/shopping-list
// 공간 치수 요약 + 실측 확인 항목 + 제품 목록(제품명/치수/가격/구매링크) + 총액. 텍스트 복사(클립보드) + 공유
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getShoppingList } from '../../api/save'
import { useFetch } from '../../hooks/useFetch'
import type { ShoppingList } from '../../types/save'
import { formatWonFull, formatDims } from '../../utils/format'
import AiNoticeBanner from '../../components/AiNoticeBanner'
import Toast from '../../components/Toast'

function toText(list: ShoppingList): string {
  const { spaceSummary: s } = list
  const lines: string[] = []
  lines.push('[HomeStyler 구매 목록]')
  lines.push('')
  lines.push(`공간 치수: ${s.widthM}m(가로) × ${s.depthM}m(세로) × ${s.heightM}m(높이)`)
  if (list.measureBeforeBuy.length > 0) {
    lines.push(`구매 전 실측 확인: ${list.measureBeforeBuy.join(', ')}`)
  }
  lines.push('')
  lines.push('제품 목록')
  list.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.brand} ${it.name}`)
    lines.push(`   치수 ${formatDims(it.widthMm, it.depthMm, it.heightMm)} / ${formatWonFull(it.price)}`)
    if (it.purchaseUrl) lines.push(`   구매: ${it.purchaseUrl}`)
  })
  lines.push('')
  lines.push(`총액: ${formatWonFull(list.totalPrice)}`)
  lines.push('')
  lines.push('* 본 추천은 AI 분석 결과로 실제 치수·시공 가능 여부와 다를 수 있습니다.')
  return lines.join('\n')
}

export default function ShoppingListPage() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const recoId = Number(recommendationId)
  const res = useFetch(() => getShoppingList(recoId), [recoId])
  const [toast, setToast] = useState('')

  async function onCopy() {
    if (res.state !== 'ok') return
    try {
      await navigator.clipboard.writeText(toText(res.data))
      setToast('구매 목록을 복사했어요')
    } catch {
      setToast('복사에 실패했어요. 직접 선택해 복사해 주세요')
    }
  }

  async function onShare() {
    if (res.state !== 'ok') return
    const text = toText(res.data)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'HomeStyler 구매 목록', text })
        return
      } catch {
        /* 취소/미지원 → 복사 폴백 */
      }
    }
    await onCopy()
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed top-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">구매 목록</h1>
      </header>

      <main className="space-y-stack-md px-margin-mobile pt-20">
        {res.state === 'loading' && (
          <p className="py-16 text-center font-body-md text-on-surface-variant">불러오는 중…</p>
        )}
        {res.state === 'error' && (
          <div className="rounded-xl bg-error-container p-4 text-on-error-container">
            <p className="font-label-md text-label-md">구매 목록을 불러오지 못했습니다</p>
            <p className="mt-1 font-body-sm text-body-sm">{res.message}</p>
          </div>
        )}

        {res.state === 'ok' && (
          <>
            {/* 공간 치수 요약 */}
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-primary">straighten</span>
                공간 치수
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: '가로', v: res.data.spaceSummary.widthM },
                  { label: '세로', v: res.data.spaceSummary.depthM },
                  { label: '높이', v: res.data.spaceSummary.heightM },
                ].map((d) => (
                  <div key={d.label} className="rounded-lg bg-surface-container p-3">
                    <p className="font-headline-md text-[20px] text-on-surface">{d.v}m</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{d.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 실측 확인 항목 */}
            {res.data.measureBeforeBuy.length > 0 && (
              <section className="rounded-xl bg-tertiary-fixed/60 p-4">
                <h3 className="mb-2 flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">rule</span>
                  구매 전 실측 확인
                </h3>
                <ul className="space-y-1">
                  {res.data.measureBeforeBuy.map((m) => (
                    <li key={m} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 제품 목록 */}
            <section className="space-y-3">
              <h2 className="font-label-md text-label-md text-on-surface">
                제품 {res.data.items.length}개
              </h2>
              {res.data.items.map((it, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{it.brand}</p>
                      <p className="font-body-md font-semibold text-on-surface">{it.name}</p>
                      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                        {formatDims(it.widthMm, it.depthMm, it.heightMm)}
                      </p>
                    </div>
                    <p className="shrink-0 font-headline-md text-[18px] text-primary">{formatWonFull(it.price)}</p>
                  </div>
                  {it.purchaseUrl && (
                    <a
                      href={it.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-surface-container py-2 font-label-sm text-label-sm text-primary active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      구매처 열기
                    </a>
                  )}
                </div>
              ))}
            </section>

            {/* 총액 */}
            <section className="flex items-center justify-between rounded-xl bg-primary-container p-5 shadow-sm">
              <span className="font-label-md text-label-md text-on-primary-container">총액</span>
              <span className="font-headline-md text-headline-md text-on-primary-container">
                {formatWonFull(res.data.totalPrice)}
              </span>
            </section>

            <AiNoticeBanner />
          </>
        )}
      </main>

      {/* 하단 액션: 복사 + 공유 */}
      {res.state === 'ok' && (
        <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-3 bg-surface/90 px-margin-mobile py-4 backdrop-blur-md">
          <button
            onClick={onCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-primary py-3.5 font-label-md text-label-md text-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
            텍스트 복사
          </button>
          <button
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-label-md text-label-md text-on-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            공유
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
