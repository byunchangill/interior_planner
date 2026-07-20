// M4 SAVE 프리뷰용 mock — 계약(m4.md) shape 그대로. VITE_USE_MOCK=true 일 때만 사용.
import type {
  SavedItem,
  SaveToggle,
  SelectToggle,
  CompareKey,
  CompareResult,
  ShareExpiry,
  ShareLinkCreated,
  ShareLink,
  PublicShare,
  ShoppingList,
} from '../../types/save'
import { SHARE_EXPIRED } from '../../types/save'

const delay = <T>(v: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))

let saved: SavedItem[] = [
  {
    recommendationId: 200, spaceId: 1, spaceName: '거실', style: 'NORDIC',
    conceptTitle: '따뜻한 북유럽 거실', thumbnailUrl: '', budgetTotal: 3450000,
    fitScoreTotal: 92, selected: true, savedAt: '2026-07-20T12:00:00Z',
  },
  {
    recommendationId: 201, spaceId: 1, spaceName: '거실', style: 'MODERN',
    conceptTitle: '모던 미니멀 거실', thumbnailUrl: '', budgetTotal: 5200000,
    fitScoreTotal: 85, selected: false, savedAt: '2026-07-19T09:00:00Z',
  },
  {
    recommendationId: 202, spaceId: 2, spaceName: '침실', style: 'WOOD',
    conceptTitle: '우드톤 침실', thumbnailUrl: '', budgetTotal: 2100000,
    fitScoreTotal: 78, selected: false, savedAt: '2026-07-18T15:30:00Z',
  },
]

export const getSaved = (): Promise<SavedItem[]> => delay([...saved])

export const save = (recommendationId: number): Promise<SaveToggle> =>
  delay({ recommendationId, saved: true })

export const unsave = (recommendationId: number): Promise<SaveToggle> => {
  saved = saved.filter((s) => s.recommendationId !== recommendationId)
  return delay({ recommendationId, saved: false })
}

export const select = (recommendationId: number): Promise<SelectToggle> => {
  const target = saved.find((s) => s.recommendationId === recommendationId)
  if (target) {
    saved.forEach((s) => {
      if (s.spaceId === target.spaceId) s.selected = s.recommendationId === recommendationId
    })
  }
  return delay({ recommendationId, selected: true })
}

export const compare = (ids: number[], _key: CompareKey): Promise<CompareResult> => {
  const cols = ids.map((id) => {
    const s = saved.find((x) => x.recommendationId === id)
    return {
      recommendationId: id,
      style: s?.style ?? 'NORDIC',
      conceptTitle: s?.conceptTitle ?? `추천안 ${id}`,
      thumbnailUrl: '',
      budgetTotal: s?.budgetTotal ?? 3000000,
      fitScoreTotal: s?.fitScoreTotal ?? 80,
      materialSummary: { wallpaper: '#F5F0E8', flooring: '#C9A227' },
      keywords: ['화이트', '우드', '미니멀'],
    }
  })
  const spaceIds = new Set(ids.map((id) => saved.find((x) => x.recommendationId === id)?.spaceId))
  return delay({ sameSpace: spaceIds.size <= 1, columns: cols })
}

let linkSeq = 500
const links: Record<number, ShareLink[]> = {}

export const createShareLink = (
  recommendationId: number,
  expiresIn: ShareExpiry,
  includeOriginalPhotos: boolean,
): Promise<ShareLinkCreated> => {
  const linkId = ++linkSeq
  const token = `mock${linkId}tok${Math.random().toString(36).slice(2, 10)}`
  const expiresAt =
    expiresIn === 'NONE'
      ? null
      : new Date(Date.now() + (expiresIn === 'D7' ? 7 : 30) * 86400000).toISOString()
  const entry: ShareLink = {
    linkId, shareUrl: `/share/${token}`, expiresAt, revoked: false,
    createdAt: new Date().toISOString(),
  }
  links[recommendationId] = [...(links[recommendationId] ?? []), entry]
  return delay({ linkId, token, shareUrl: entry.shareUrl, expiresAt, includeOriginalPhotos })
}

export const getShareLinks = (recommendationId: number): Promise<ShareLink[]> =>
  delay([...(links[recommendationId] ?? [])])

export const revokeShareLink = (linkId: number): Promise<{ linkId: number; revoked: boolean }> => {
  Object.values(links).forEach((arr) =>
    arr.forEach((l) => {
      if (l.linkId === linkId) l.revoked = true
    }),
  )
  return delay({ linkId, revoked: true })
}

export const getPublicShare = (token: string): Promise<PublicShare> => {
  if (token.includes('expired')) return Promise.reject(new Error(SHARE_EXPIRED))
  return delay({
    style: 'NORDIC',
    conceptTitle: '따뜻한 북유럽 거실',
    conceptDescription:
      '자연광을 살리면서 북유럽 특유의 절제된 소재와 색을 조합해, 일상에 안정감을 주는 공간을 제안합니다.',
    keywords: ['화이트', '우드', '미니멀'],
    budgetTotal: 3450000,
    fitScoreTotal: 92,
    materials: {
      wallpaper: { color: '#F5F0E8', material: '실크 벽지' },
      flooring: { color: '#C9A227', material: '오크 원목마루' },
      lighting: { color: '#FFF3E0', material: '따뜻한 간접조명' },
      curtain: { color: '#FFFFFF', material: '리넨' },
    },
    items: [
      { brand: 'A사', name: '3인용 패브릭 소파', widthMm: 2180, depthMm: 920, heightMm: 810, price: 1290000, position: '거실 남측 벽' },
      { brand: 'B사', name: '오크 원목 5단 책장', widthMm: 900, depthMm: 320, heightMm: 1800, price: 430000, position: '거실 동측 벽' },
    ],
    afterImageUrl: '',
    originalPhotos: [],
    disclaimers: ['본 추천은 AI 분석 결과로 실제 치수·시공 가능 여부와 다를 수 있습니다.'],
  })
}

export const getShoppingList = (_recommendationId: number): Promise<ShoppingList> =>
  delay({
    spaceSummary: { widthM: 4.5, depthM: 3.6, heightM: 2.3 },
    measureBeforeBuy: ['남측 벽 길이', '현관 폭'],
    items: [
      { brand: 'A사', name: '3인용 패브릭 소파', widthMm: 2180, depthMm: 920, heightMm: 810, price: 1290000, purchaseUrl: 'https://example.com/p/301' },
      { brand: 'B사', name: '오크 원목 5단 책장', widthMm: 900, depthMm: 320, heightMm: 1800, price: 430000, purchaseUrl: 'https://example.com/p/302' },
      { brand: 'C사', name: '벽부 간접 조명 세트', widthMm: 1200, depthMm: 80, heightMm: 60, price: 210000, purchaseUrl: 'https://example.com/p/303' },
    ],
    totalPrice: 3450000,
  })
