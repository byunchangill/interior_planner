// RECO-001/002 조건 설정 (공간·스타일·예산·색상·가구 + 생활방식 설문) — docs/_10
// POST /analyses → 202 analysisId → 분석 진행(RECO-003)로 이동
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSpaces, getSpace } from '../../api/space'
import { createAnalysis } from '../../api/reco'
import { useFetch } from '../../hooks/useFetch'
import Toast from '../../components/Toast'
import type { SpaceDetail } from '../../types/space'
import {
  STYLE_LABELS,
  STYLE_TYPES,
  STYLE_GRADIENTS,
  BUDGET_LABELS,
  BUDGET_RANGES,
  FURNITURE_TYPE_LABELS,
  FURNITURE_TYPES,
  COLOR_PALETTE,
  STORAGE_PREF_LABELS,
  HOUSING_TYPE_LABELS,
  type StyleType,
  type BudgetRange,
  type FurnitureType,
  type StoragePreference,
  type HousingType,
  type Lifestyle,
} from '../../types/reco'

export default function RecoSetupPage() {
  const navigate = useNavigate()
  const spacesRes = useFetch(getSpaces, [])

  const [spaceId, setSpaceId] = useState<number | null>(null)
  const [spaceDetail, setSpaceDetail] = useState<SpaceDetail | null>(null)
  const [styles, setStyles] = useState<StyleType[]>([])
  const [budgetRange, setBudgetRange] = useState<BudgetRange | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [furniture, setFurniture] = useState<FurnitureType[]>([])
  const [keepIds, setKeepIds] = useState<number[]>([])
  const [life, setLife] = useState<Lifestyle>({
    householdSize: 1,
    hasChildren: false,
    hasPets: false,
    worksFromHome: false,
    cooksOften: false,
    storagePreference: 'STORAGE',
    housingType: 'JEONSE',
    residenceYears: 1,
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // 공간 선택 시 상세를 불러와 유지 가구 목록을 노출
  useEffect(() => {
    if (spaceId == null) {
      setSpaceDetail(null)
      setKeepIds([])
      return
    }
    let alive = true
    getSpace(spaceId)
      .then((d) => {
        if (!alive) return
        setSpaceDetail(d)
        setKeepIds(d.furniture.filter((f) => f.keep && f.furnitureId).map((f) => f.furnitureId!))
      })
      .catch(() => alive && setSpaceDetail(null))
    return () => {
      alive = false
    }
  }, [spaceId])

  function toggleStyle(s: StyleType) {
    setStyles((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= 3 ? cur : [...cur, s],
    )
  }
  function toggleColor(hex: string) {
    setColors((cur) => (cur.includes(hex) ? cur.filter((x) => x !== hex) : [...cur, hex]))
  }
  function toggleFurniture(f: FurnitureType) {
    setFurniture((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  }
  function toggleKeep(id: number) {
    setKeepIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const canSubmit = spaceId != null && styles.length >= 1 && styles.length <= 3 && budgetRange != null

  async function onSubmit() {
    if (!canSubmit || submitting) {
      if (!spaceId) setToast('분석할 공간을 선택해주세요.')
      else if (styles.length < 1) setToast('스타일을 1개 이상 선택해주세요.')
      else if (!budgetRange) setToast('예산 구간을 선택해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const res = await createAnalysis({
        spaceId: spaceId!,
        styles,
        budgetRange: budgetRange!,
        preferredColors: colors.length ? colors : undefined,
        requiredFurniture: furniture.length ? furniture : undefined,
        keepFurnitureIds: keepIds.length ? keepIds : undefined,
        lifestyle: life,
      })
      navigate(`/reco/jobs/${res.analysisId}`)
    } catch (e) {
      setToast(e instanceof Error ? e.message : '분석 요청에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface/80 px-margin-mobile py-4 shadow-sm backdrop-blur-md">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">맞춤 인테리어 분석</h1>
      </header>

      <main className="space-y-stack-lg px-margin-mobile pt-6">
        {/* 공간 선택 */}
        <section>
          <SectionTitle title="분석할 공간" desc="사진·치수가 등록된 공간을 선택하세요." />
          {spacesRes.state === 'loading' && (
            <p className="py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
              공간을 불러오는 중…
            </p>
          )}
          {spacesRes.state === 'error' && (
            <p className="rounded-xl bg-error-container p-4 font-body-sm text-body-sm text-on-error-container">
              공간 목록을 불러오지 못했습니다.
            </p>
          )}
          {spacesRes.state === 'ok' &&
            (spacesRes.data.length === 0 ? (
              <button
                onClick={() => navigate('/spaces/new')}
                className="w-full rounded-2xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low p-6 text-center"
              >
                <p className="font-label-md text-label-md text-on-surface">등록된 공간이 없습니다</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  먼저 공간을 등록해주세요
                </p>
              </button>
            ) : (
              <div className="-mx-margin-mobile flex gap-3 overflow-x-auto px-margin-mobile pb-2 no-scrollbar">
                {spacesRes.data.map((sp) => {
                  const active = sp.spaceId === spaceId
                  return (
                    <button
                      key={sp.spaceId}
                      onClick={() => setSpaceId(sp.spaceId)}
                      className={[
                        'min-w-[150px] flex-shrink-0 overflow-hidden rounded-2xl border-2 text-left transition-all',
                        active ? 'border-primary scale-[0.98]' : 'border-transparent',
                      ].join(' ')}
                    >
                      <div
                        className="h-24 w-full bg-cover bg-center bg-surface-container-high"
                        style={sp.thumbnailUrl ? { backgroundImage: `url(${sp.thumbnailUrl})` } : undefined}
                      />
                      <div className="bg-surface-container-lowest p-3">
                        <p className="font-label-md text-label-md text-on-surface">{sp.name}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          사진 {sp.photoCount}장
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
        </section>

        {/* 스타일 (최대 3) */}
        <section>
          <SectionTitle title="선호하는 스타일" desc="가장 마음에 드는 스타일을 최대 3개까지 선택하세요." />
          <div className="-mx-margin-mobile flex gap-4 overflow-x-auto px-margin-mobile pb-2 no-scrollbar">
            {STYLE_TYPES.map((s) => {
              const active = styles.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className={[
                    'relative h-56 min-w-[180px] flex-shrink-0 overflow-hidden rounded-xl border-2 shadow-sm transition-all',
                    active ? 'border-primary scale-[0.98]' : 'border-transparent',
                  ].join(' ')}
                  style={{ background: STYLE_GRADIENTS[s] }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-label-md text-label-md text-white">
                    {STYLE_LABELS[s]}
                  </span>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* 예산 구간 */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
          <SectionTitle title="예산 범위" />
          <div className="flex flex-col gap-2">
            {BUDGET_RANGES.map((b) => {
              const active = b === budgetRange
              return (
                <button
                  key={b}
                  onClick={() => setBudgetRange(b)}
                  className={[
                    'flex items-center justify-between rounded-xl border px-4 py-3 font-label-md text-label-md transition-all',
                    active
                      ? 'border-primary bg-primary-fixed text-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
                  ].join(' ')}
                >
                  {BUDGET_LABELS[b]}
                  {active && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* 선호 색상 */}
        <section>
          <SectionTitle title="주요 컬러 팔레트" desc="선택 사항 (여러 개 가능)" />
          <div className="grid grid-cols-4 gap-3">
            {COLOR_PALETTE.map((c) => {
              const active = colors.includes(c.hex)
              const lightBg = ['#F5F0E8', '#C9CDD2', '#FFFFFF'].includes(c.hex)
              return (
                <button
                  key={c.hex}
                  onClick={() => toggleColor(c.hex)}
                  className="flex flex-col items-center gap-2"
                >
                  <span
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-sm transition-all',
                      active ? 'border-primary' : 'border-outline-variant/40',
                    ].join(' ')}
                    style={{ backgroundColor: c.hex }}
                  >
                    {active && (
                      <span
                        className={`material-symbols-outlined text-[20px] ${lightBg ? 'text-primary' : 'text-white'}`}
                      >
                        check
                      </span>
                    )}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{c.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 필요 가구 */}
        <section className="glass-card rounded-2xl p-6 shadow-sm">
          <SectionTitle title="새로 필요한 가구" desc="선택 사항" />
          <div className="grid grid-cols-2 gap-3">
            {FURNITURE_TYPES.map((f) => {
              const active = furniture.includes(f)
              return (
                <label
                  key={f}
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => toggleFurniture(f)}
                >
                  <span
                    className={[
                      'flex h-6 w-6 items-center justify-center rounded border-2 transition-colors',
                      active ? 'border-primary bg-primary' : 'border-outline-variant',
                    ].join(' ')}
                  >
                    {active && (
                      <span className="material-symbols-outlined text-[16px] text-white">check</span>
                    )}
                  </span>
                  <span
                    className={`font-body-md text-body-md ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}
                  >
                    {FURNITURE_TYPE_LABELS[f]}
                  </span>
                </label>
              )
            })}
          </div>
        </section>

        {/* 유지할 기존 가구 (선택 공간에 가구가 있을 때만) */}
        {spaceDetail && spaceDetail.furniture.length > 0 && (
          <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
            <SectionTitle title="유지할 기존 가구" desc="추천 배치에 그대로 반영됩니다." />
            <div className="flex flex-col gap-2">
              {spaceDetail.furniture
                .filter((f) => f.furnitureId)
                .map((f) => {
                  const active = keepIds.includes(f.furnitureId!)
                  return (
                    <button
                      key={f.furnitureId}
                      onClick={() => toggleKeep(f.furnitureId!)}
                      className={[
                        'flex items-center justify-between rounded-xl border px-4 py-3 font-body-md text-body-md transition-all',
                        active
                          ? 'border-secondary bg-secondary-container text-on-secondary-container'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
                      ].join(' ')}
                    >
                      {f.label}
                      <span className="material-symbols-outlined text-[20px]">
                        {active ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  )
                })}
            </div>
          </section>
        )}

        {/* 생활방식 설문 (M3 신규 · 추천 개인화 핵심) */}
        <section className="rounded-2xl border border-primary/20 bg-primary-fixed/30 p-6">
          <SectionTitle title="생활방식 설문" desc="더 정확한 맞춤 추천을 위해 알려주세요." />
          <div className="space-y-5">
            <Stepper
              label="거주 인원"
              value={life.householdSize}
              min={1}
              max={9}
              onChange={(v) => setLife({ ...life, householdSize: v })}
            />
            <Stepper
              label="현재 거주 연수"
              suffix="년"
              value={life.residenceYears}
              min={0}
              max={50}
              onChange={(v) => setLife({ ...life, residenceYears: v })}
            />
            <ToggleRow label="아이가 있어요" value={life.hasChildren} onChange={(v) => setLife({ ...life, hasChildren: v })} />
            <ToggleRow label="반려동물과 함께 살아요" value={life.hasPets} onChange={(v) => setLife({ ...life, hasPets: v })} />
            <ToggleRow label="재택근무를 해요" value={life.worksFromHome} onChange={(v) => setLife({ ...life, worksFromHome: v })} />
            <ToggleRow label="요리를 자주 해요" value={life.cooksOften} onChange={(v) => setLife({ ...life, cooksOften: v })} />
            <SegRow<StoragePreference>
              label="수납 선호"
              value={life.storagePreference}
              options={Object.entries(STORAGE_PREF_LABELS) as [StoragePreference, string][]}
              onChange={(v) => setLife({ ...life, storagePreference: v })}
            />
            <SegRow<HousingType>
              label="주거 형태"
              value={life.housingType}
              options={Object.entries(HOUSING_TYPE_LABELS) as [HousingType, string][]}
              onChange={(v) => setLife({ ...life, housingType: v })}
            />
          </div>
        </section>
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-[68px] left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-outline-variant bg-surface/90 p-4 backdrop-blur-md">
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-label-md text-label-md text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          <span>{submitting ? '분석 요청 중…' : '맞춤 인테리어 분석 시작'}</span>
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-stack-md flex flex-col gap-1">
      <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
      {desc && <p className="font-body-sm text-body-sm text-on-surface-variant">{desc}</p>}
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  suffix = '명',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface"
          aria-label="감소"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <span className="w-14 text-center font-label-md text-label-md text-on-surface">
          {value}
          {suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface"
          aria-label="증가"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between">
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
      <span
        className={[
          'relative h-7 w-12 rounded-full transition-colors',
          value ? 'bg-primary' : 'bg-outline-variant',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
            value ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

function SegRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
      <div className="flex gap-2">
        {options.map(([val, lbl]) => {
          const active = val === value
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={[
                'rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-all',
                active
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-high text-on-surface-variant',
              ].join(' ')}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}
