// SPACE-005 치수 입력·수정 + SPACE-006 기존 가구 등록 (통합 화면) — docs/_9
// GET /spaces/{id} 로 AI 추정 치수·가구 로드 → 사용자 수정 →
//   PATCH /spaces/{id}/dimensions (isUserVerified=true) + PUT /spaces/{id}/furniture.
// FR-SPACE-005: AI 추정치 고지 배너 + confidence 표시 필수.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSpace, patchDimensions, putFurniture } from '../../api/space'
import Toast from '../../components/Toast'
import {
  CONFIDENCE_META,
  OPENING_TYPE_LABELS,
  WALLS,
  WALL_LABELS,
  FURNITURE_TYPES,
  FURNITURE_TYPE_LABELS,
  type Confidence,
  type Furniture,
  type Opening,
  type OpeningType,
  type Wall,
  type FurnitureType,
} from '../../types/space'

export default function SpaceDimensionsPage() {
  const { id = '' } = useParams()
  const spaceId = Number(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [confidence, setConfidence] = useState<Confidence>('MEDIUM')
  const [widthM, setWidthM] = useState('')
  const [depthM, setDepthM] = useState('')
  const [heightM, setHeightM] = useState('')
  const [openings, setOpenings] = useState<Opening[]>([])
  const [furniture, setFurniture] = useState<Furniture[]>([])

  useEffect(() => {
    let alive = true
    getSpace(spaceId)
      .then((s) => {
        if (!alive) return
        const d = s.dimensions
        setConfidence(d?.confidence ?? 'MEDIUM')
        setWidthM(d ? String(d.widthM) : '')
        setDepthM(d ? String(d.depthM) : '')
        setHeightM(d ? String(d.heightM) : '2.3')
        setOpenings(d?.openings ?? [])
        setFurniture(s.furniture)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (alive) {
          setLoadError(e instanceof Error ? e.message : String(e))
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [spaceId])

  const w = parseFloat(widthM)
  const d = parseFloat(depthM)
  const areaPyeong = w > 0 && d > 0 ? Math.round(((w * d) / 3.3058) * 10) / 10 : null

  async function onSave() {
    // 치수 검증 (계약: width/depth 1.0~20.0, height 2.0~5.0)
    const h = parseFloat(heightM)
    if (!(w >= 1 && w <= 20)) return setToast('가로 길이는 1.0~20.0m 범위여야 합니다.')
    if (!(d >= 1 && d <= 20)) return setToast('세로 길이는 1.0~20.0m 범위여야 합니다.')
    if (heightM && !(h >= 2 && h <= 5)) return setToast('천장고는 2.0~5.0m 범위여야 합니다.')
    if (furniture.some((f) => !f.label.trim())) return setToast('가구 이름을 모두 입력해 주세요.')

    setSaving(true)
    try {
      await patchDimensions(spaceId, {
        widthM: round1(w),
        depthM: round1(d),
        heightM: heightM ? round1(h) : null,
        isUserVerified: true,
        openings: openings.map((o) => ({ type: o.type, wall: o.wall, widthM: round1(o.widthM) })),
      })
      await putFurniture(spaceId, {
        furniture: furniture.map((f) => ({
          furnitureId: f.furnitureId,
          type: f.type,
          label: f.label.trim(),
          keep: f.keep,
        })),
      })
      setToast('저장했습니다.')
      setTimeout(() => navigate(`/spaces/${spaceId}`, { replace: true }), 500)
    } catch {
      setToast('저장에 실패했습니다. 입력값을 확인해 주세요.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <CenterMsg>
        <p className="font-body-md text-on-surface-variant">불러오는 중…</p>
      </CenterMsg>
    )
  }
  if (loadError) {
    return (
      <CenterMsg>
        <span className="material-symbols-outlined text-3xl text-primary">error</span>
        <p className="mt-2 font-label-md text-on-surface">공간 정보를 불러오지 못했습니다</p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{loadError}</p>
        <button
          onClick={() => navigate('/spaces')}
          className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-md text-on-primary"
        >
          목록으로
        </button>
      </CenterMsg>
    )
  }

  const meta = CONFIDENCE_META[confidence]

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-1 hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">치수 · 가구 확인</h1>
      </header>

      {/* FR-SPACE-005 AI 추정치 고지 배너 (고정) */}
      <div className="fixed left-0 top-[64px] z-40 flex w-full items-center justify-center gap-2 border-b border-tertiary/20 bg-tertiary-fixed px-4 py-3 shadow-md">
        <span
          className="material-symbols-outlined text-tertiary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
        <p className="text-center font-label-md text-label-md font-bold text-on-tertiary-fixed">
          AI 추정치입니다. 실제 치수와 다를 수 있으니 확인 후 수정해 주세요.
        </p>
      </div>

      <main className="space-y-stack-lg px-margin-mobile pt-32">
        {/* 치수 정보 */}
        <section className="rounded-xl border border-outline-variant bg-white p-stack-lg shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">공간 치수 정보</h2>
            <span
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${meta.cls}`}
            >
              <span className="material-symbols-outlined text-[16px]">stars</span>
              AI 신뢰도 {meta.label}
            </span>
          </div>

          <div className="space-y-4">
            <NumField label="가로 길이 (m)" value={widthM} onChange={setWidthM} placeholder="4.2" />
            <NumField label="세로 길이 (m)" value={depthM} onChange={setDepthM} placeholder="3.5" />
            <NumField label="천장고 (m)" value={heightM} onChange={setHeightM} placeholder="2.3" />
          </div>

          {areaPyeong !== null && (
            <div className="glass-card mt-6 flex items-start gap-3 rounded-xl border border-primary/10 p-4">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                입력하신 치수 기준 이 공간은 <b>약 {areaPyeong}평</b>입니다.
              </p>
            </div>
          )}
        </section>

        {/* 창문 / 문 (openings) */}
        <section className="space-y-stack-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">창문 · 문</h3>
            <button
              onClick={() =>
                setOpenings((o) => [...o, { type: 'WINDOW', wall: 'NORTH', widthM: 1 }])
              }
              className="flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              추가
            </button>
          </div>
          {openings.length === 0 && (
            <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-center font-body-sm text-body-sm text-on-surface-variant">
              등록된 창문·문이 없습니다. 추가해 주세요.
            </p>
          )}
          <div className="space-y-3">
            {openings.map((o, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-outline-variant bg-white p-3"
              >
                <select
                  value={o.type}
                  onChange={(e) => patchOpening(setOpenings, i, { type: e.target.value as OpeningType })}
                  className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-body-sm outline-none focus:border-primary"
                >
                  {(Object.keys(OPENING_TYPE_LABELS) as OpeningType[]).map((t) => (
                    <option key={t} value={t}>
                      {OPENING_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={o.wall}
                  onChange={(e) => patchOpening(setOpenings, i, { wall: e.target.value as Wall })}
                  className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-body-sm outline-none focus:border-primary"
                >
                  {WALLS.map((wl) => (
                    <option key={wl} value={wl}>
                      {WALL_LABELS[wl]}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={o.widthM}
                    onChange={(e) =>
                      patchOpening(setOpenings, i, { widthM: parseFloat(e.target.value) || 0 })
                    }
                    className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-8 font-body-sm outline-none focus:border-primary"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
                    m
                  </span>
                </div>
                <button
                  onClick={() => setOpenings((o2) => o2.filter((_, idx) => idx !== i))}
                  aria-label="삭제"
                  className="rounded-full p-2 text-on-surface-variant hover:text-error"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 기존 가구 (SPACE-006) */}
        <section className="space-y-stack-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">기존 가구</h3>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[12px] font-bold text-on-secondary-container">
                {furniture.length}건
              </span>
            </div>
            <button
              onClick={() =>
                setFurniture((f) => [...f, { type: 'SOFA', label: '', keep: true, source: 'USER_ADDED' }])
              }
              className="flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              가구 추가
            </button>
          </div>

          {furniture.length === 0 && (
            <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-center font-body-sm text-body-sm text-on-surface-variant">
              인식된 가구가 없습니다. 유지할 가구를 추가해 주세요.
            </p>
          )}

          <div className="space-y-3">
            {furniture.map((f, i) => (
              <div
                key={f.furnitureId ?? `new-${i}`}
                className="rounded-xl border border-outline-variant bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  {f.source === 'AI_DETECTED' ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary-container/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      AI 인식
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                      직접 추가
                    </span>
                  )}
                  <button
                    onClick={() => setFurniture((f2) => f2.filter((_, idx) => idx !== i))}
                    aria-label="가구 삭제"
                    className="rounded-full p-1 text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={f.type}
                    onChange={(e) => patchFurniture(setFurniture, i, { type: e.target.value as FurnitureType })}
                    className="h-11 w-28 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 font-body-sm outline-none focus:border-primary"
                  >
                    {FURNITURE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {FURNITURE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={f.label}
                    placeholder="가구 이름 (예: 3인용 소파)"
                    onChange={(e) => patchFurniture(setFurniture, i, { label: e.target.value })}
                    className="h-11 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-sm outline-none focus:border-primary"
                  />
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={f.keep}
                    onChange={(e) => patchFurniture(setFurniture, i, { keep: e.target.checked })}
                    className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span
                    className={`font-label-sm text-label-sm ${f.keep ? 'text-primary' : 'text-on-surface-variant'}`}
                  >
                    {f.keep ? '유지 희망' : '제외 예정'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 하단 고정 저장 */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-outline-variant bg-surface/90 px-margin-mobile py-4 backdrop-blur-md">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-60"
        >
          <span className="material-symbols-outlined">save</span>
          {saving ? '저장 중…' : '저장하기'}
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function patchOpening(
  set: React.Dispatch<React.SetStateAction<Opening[]>>,
  i: number,
  patch: Partial<Opening>,
) {
  set((arr) => arr.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
}

function patchFurniture(
  set: React.Dispatch<React.SetStateAction<Furniture[]>>,
  i: number,
  patch: Partial<Furniture>,
) {
  set((arr) => arr.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1">
      <label className="font-label-md text-label-md text-on-surface-variant">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-4 pr-10 font-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
          m
        </span>
      </div>
    </div>
  )
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-margin-mobile text-center">
      {children}
    </div>
  )
}
