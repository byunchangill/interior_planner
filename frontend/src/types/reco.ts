// RECO 도메인 타입 — _workspace/contracts/m3.md 기준
import type { StyleType } from './home'
import type { FurnitureType } from './space'

export type { StyleType } from './home'
export type { FurnitureType } from './space'
export { STYLE_LABELS, STYLE_TYPES } from './home'
export { FURNITURE_TYPE_LABELS, FURNITURE_TYPES } from './space'

// ── Enums (계약 §Enums) ──────────────────────────────────────────
export type BudgetRange = 'UNDER_100' | 'R100_300' | 'R300_500' | 'R500_1000' | 'OVER_1000'
export type JobStatus =
  | 'QUEUED'
  | 'ANALYZING_STRUCTURE'
  | 'ANALYZING_LIGHT'
  | 'ANALYZING_FLOW'
  | 'GENERATING_RECO'
  | 'GENERATING_VISUAL'
  | 'COMPLETED'
  | 'FAILED'
export type Verdict = 'GOOD' | 'CHECK' | 'BLOCKED'
export type StoragePreference = 'STORAGE' | 'OPENNESS'
export type HousingType = 'JEONSE' | 'WOLSE' | 'OWNED'

// ── 라벨 매핑 (디자인 이식용) ─────────────────────────────────────
export const BUDGET_LABELS: Record<BudgetRange, string> = {
  UNDER_100: '100만원 이하',
  R100_300: '100~300만원',
  R300_500: '300~500만원',
  R500_1000: '500~1,000만원',
  OVER_1000: '1,000만원 이상',
}
export const BUDGET_RANGES = Object.keys(BUDGET_LABELS) as BudgetRange[]

export const STORAGE_PREF_LABELS: Record<StoragePreference, string> = {
  STORAGE: '수납 중심',
  OPENNESS: '개방감 중심',
}
export const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  JEONSE: '전세',
  WOLSE: '월세',
  OWNED: '자가',
}

// 스타일 카드 배경 (원본 원격 이미지는 만료 위험 → 스타일별 그라디언트 플레이스홀더)
// 스타일 그라디언트는 home.ts 단일 정본을 재사용(앱 전역 통일)
export { STYLE_GRADIENTS } from './home'

// 선호 색상 팔레트 (hex 그대로 요청에 전송)
export const COLOR_PALETTE: { hex: string; label: string }[] = [
  { hex: '#F5F0E8', label: '웜 화이트' },
  { hex: '#8B7355', label: '우드 브라운' },
  { hex: '#3525CD', label: '인디고' },
  { hex: '#006C4A', label: '에메랄드' },
  { hex: '#C9CDD2', label: '쿨 그레이' },
  { hex: '#703A00', label: '테라코타' },
  { hex: '#191C1D', label: '미드나잇' },
  { hex: '#FFFFFF', label: '화이트' },
]

// 적합도 신호등 (GOOD 초록 / CHECK 노랑 / BLOCKED 빨강)
export const VERDICT_META: Record<
  Verdict,
  { label: string; badge: string; dot: string }
> = {
  GOOD: { label: '적합', badge: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  CHECK: { label: '확인 필요', badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  BLOCKED: { label: '부적합', badge: 'bg-error-container text-on-error-container', dot: 'bg-error' },
}

// 진행률 매핑 (계약 표: FE 진행 화면 단계 표시용)
export const PROGRESS_STEPS: { status: JobStatus; label: string }[] = [
  { status: 'ANALYZING_STRUCTURE', label: '구조·치수 분석' },
  { status: 'ANALYZING_LIGHT', label: '채광 분석' },
  { status: 'ANALYZING_FLOW', label: '동선 분석' },
  { status: 'GENERATING_RECO', label: '맞춤 추천 생성' },
  { status: 'GENERATING_VISUAL', label: '전후 비교 시각화' },
]

// ── 요청 타입 ────────────────────────────────────────────────────
export interface Lifestyle {
  householdSize: number
  hasChildren: boolean
  hasPets: boolean
  worksFromHome: boolean
  cooksOften: boolean
  storagePreference: StoragePreference
  housingType: HousingType
  residenceYears: number
}

export interface AnalysisRequest {
  spaceId: number
  styles: StyleType[]
  budgetRange: BudgetRange
  preferredColors?: string[]
  requiredFurniture?: FurnitureType[]
  keepFurnitureIds?: number[]
  lifestyle: Lifestyle
}

// ── 응답 타입 ────────────────────────────────────────────────────
// POST /analyses (202)
export interface AnalysisCreated {
  analysisId: number
  status: JobStatus
  estimatedSeconds: number
}

// GET /analyses/{id}
export interface AnalysisStatus {
  analysisId: number
  status: JobStatus
  progress: number
  currentStepLabel: string
  recommendationIds: number[]
  styles: StyleType[] // recommendationIds와 동일 순서의 스타일명 (요약 탭 라벨용)
  failureReason?: string
}

// GET /recommendations/{id}
export interface Concept {
  title: string
  description: string
  keywords: string[]
}
export interface Layout {
  imageUrl: string | null
  flowDescription: string
  reason: string
}
export interface MaterialSpec {
  color: string
  material: string
  reason: string
  expertRequired?: boolean
}
export interface Materials {
  wallpaper: MaterialSpec
  flooring: MaterialSpec
  lighting: MaterialSpec
  curtain: MaterialSpec
}
export interface KeepFurnitureLayout {
  description: string
  furnitureIds: number[]
}
export interface BudgetPlan {
  range: BudgetRange
  title: string
  totalPrice: number
  itemIds: number[]
}
export interface RecoItem {
  itemId: number
  brand: string
  name: string
  category: FurnitureType
  widthMm: number
  depthMm: number
  heightMm: number
  price: number
  purchaseUrl: string
  position: string
  reason: string
  expertRequired: boolean
}
export interface FitCheck {
  label: string
  verdict: Verdict
  detail: string
}
export interface FitScore {
  total: number
  checks: FitCheck[]
  measureBeforeBuy: string[]
}
export interface Recommendation {
  recommendationId: number
  analysisId: number
  spaceId: number
  style: StyleType
  concept: Concept
  layout: Layout
  materials: Materials
  spaceTips: string[]
  storage: string[]
  keepFurnitureLayout: KeepFurnitureLayout | null
  budgetPlans: BudgetPlan[]
  items: RecoItem[]
  fitScore: FitScore
  disclaimers: string[]
}

// GET /recommendations/{id}/visuals
export interface VisualPair {
  beforeUrl: string | null
  afterUrl: string | null
  viewLabel: string
}
export interface Visuals {
  pairs: VisualPair[]
  partial?: boolean
}

// materials 섹션을 순회하기 위한 키 라벨
export const MATERIAL_KEYS: { key: keyof Materials; label: string; icon: string }[] = [
  { key: 'wallpaper', label: '벽지', icon: 'wallpaper' },
  { key: 'flooring', label: '바닥재', icon: 'grid_on' },
  { key: 'lighting', label: '조명', icon: 'lightbulb' },
  { key: 'curtain', label: '커튼', icon: 'blinds' },
]
