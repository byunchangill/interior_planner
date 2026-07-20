// SAVE 도메인 타입 — _workspace/contracts/m4.md 기준
import type { StyleType } from './home'

export type { StyleType } from './home'

// ── Enums (계약 §Enums) ──────────────────────────────────────────
export type CompareKey = 'STYLE' | 'BUDGET' | 'LAYOUT' | 'MATERIALS'
export type ShareExpiry = 'D7' | 'D30' | 'NONE'

export const COMPARE_KEYS: { key: CompareKey; label: string }[] = [
  { key: 'STYLE', label: '스타일' },
  { key: 'BUDGET', label: '예산' },
  { key: 'LAYOUT', label: '배치' },
  { key: 'MATERIALS', label: '자재' },
]

export const SHARE_EXPIRY_OPTIONS: { value: ShareExpiry; label: string }[] = [
  { value: 'D7', label: '7일' },
  { value: 'D30', label: '30일' },
  { value: 'NONE', label: '제한 없음' },
]

// ── 응답 타입 ────────────────────────────────────────────────────
// GET /saved
export interface SavedItem {
  recommendationId: number
  spaceId: number
  spaceName: string
  style: StyleType
  conceptTitle: string
  thumbnailUrl: string
  budgetTotal: number
  fitScoreTotal: number
  selected: boolean
  savedAt: string
}

// POST /recommendations/{id}/save · DELETE
export interface SaveToggle {
  recommendationId: number
  saved: boolean
}

// PUT /recommendations/{id}/select
export interface SelectToggle {
  recommendationId: number
  selected: boolean
}

// POST /recommendations/compare
export interface CompareColumn {
  recommendationId: number
  style: StyleType
  conceptTitle: string
  thumbnailUrl: string
  budgetTotal: number
  fitScoreTotal: number
  materialSummary: Record<string, string>
  keywords: string[]
}
export interface CompareResult {
  sameSpace: boolean
  columns: CompareColumn[]
}

// POST /recommendations/{id}/share-links
export interface ShareLinkCreated {
  linkId: number
  token: string
  shareUrl: string
  expiresAt: string | null
  includeOriginalPhotos: boolean
}

// GET /recommendations/{id}/share-links
export interface ShareLink {
  linkId: number
  shareUrl: string
  expiresAt: string | null
  revoked: boolean
  createdAt: string
}

// GET /share/{token} (공개)
export interface PublicMaterial {
  color: string
  material: string
}
export interface PublicShareItem {
  brand: string
  name: string
  widthMm: number
  depthMm: number
  heightMm: number
  price: number
  position: string
}
export interface PublicShare {
  style: StyleType
  conceptTitle: string
  conceptDescription: string
  keywords: string[]
  budgetTotal: number
  fitScoreTotal: number
  materials: Record<string, PublicMaterial>
  items: PublicShareItem[]
  afterImageUrl: string
  originalPhotos: string[]
  disclaimers: string[]
}

// GET /recommendations/{id}/shopping-list
export interface ShoppingItem {
  brand: string
  name: string
  widthMm: number
  depthMm: number
  heightMm: number
  price: number
  purchaseUrl: string
}
export interface ShoppingList {
  spaceSummary: { widthM: number; depthM: number; heightM: number }
  measureBeforeBuy: string[]
  items: ShoppingItem[]
  totalPrice: number
}

// 공개 뷰 만료/회수 링크 식별용 에러 코드 (SHARE_001 → HTTP 410)
export const SHARE_EXPIRED = 'SHARE_001'
