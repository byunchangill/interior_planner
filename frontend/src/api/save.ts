import { AxiosError } from 'axios'
import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
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
} from '../types/save'
import { SHARE_EXPIRED } from '../types/save'
import * as mock from './mock/save'

// 백엔드 미완성 시 프리뷰용 mock 스위치. `VITE_USE_MOCK=true` 로 켠다.
const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// GET /saved — 보관함 목록 (SAVE-001)
export function getSaved(): Promise<SavedItem[]> {
  if (MOCK) return mock.getSaved()
  return unwrap(api.get<ApiResponse<{ items: SavedItem[] }>>('/saved')).then((d) => d.items)
}

// POST /recommendations/{id}/save — 저장
export function save(recommendationId: number): Promise<SaveToggle> {
  if (MOCK) return mock.save(recommendationId)
  return unwrap(api.post<ApiResponse<SaveToggle>>(`/recommendations/${recommendationId}/save`))
}

// DELETE /recommendations/{id}/save — 저장 해제
export function unsave(recommendationId: number): Promise<SaveToggle> {
  if (MOCK) return mock.unsave(recommendationId)
  return unwrap(api.delete<ApiResponse<SaveToggle>>(`/recommendations/${recommendationId}/save`))
}

// PUT /recommendations/{id}/select — "이 안으로 결정" (같은 공간 단일 대표)
export function select(recommendationId: number): Promise<SelectToggle> {
  if (MOCK) return mock.select(recommendationId)
  return unwrap(api.put<ApiResponse<SelectToggle>>(`/recommendations/${recommendationId}/select`))
}

// POST /recommendations/compare — 비교 (SAVE-002)
export function compare(recommendationIds: number[], compareKey: CompareKey): Promise<CompareResult> {
  if (MOCK) return mock.compare(recommendationIds, compareKey)
  return unwrap(
    api.post<ApiResponse<CompareResult>>('/recommendations/compare', { recommendationIds, compareKey }),
  )
}

// POST /recommendations/{id}/share-links — 공유 링크 생성 (SAVE-003)
export function createShareLink(
  recommendationId: number,
  expiresIn: ShareExpiry,
  includeOriginalPhotos: boolean,
): Promise<ShareLinkCreated> {
  if (MOCK) return mock.createShareLink(recommendationId, expiresIn, includeOriginalPhotos)
  return unwrap(
    api.post<ApiResponse<ShareLinkCreated>>(`/recommendations/${recommendationId}/share-links`, {
      expiresIn,
      includeOriginalPhotos,
    }),
  )
}

// GET /recommendations/{id}/share-links — 링크 목록/관리
export function getShareLinks(recommendationId: number): Promise<ShareLink[]> {
  if (MOCK) return mock.getShareLinks(recommendationId)
  return unwrap(
    api.get<ApiResponse<{ items: ShareLink[] }>>(`/recommendations/${recommendationId}/share-links`),
  ).then((d) => d.items)
}

// DELETE /share-links/{linkId} — 링크 회수
export function revokeShareLink(linkId: number): Promise<{ linkId: number; revoked: boolean }> {
  if (MOCK) return mock.revokeShareLink(linkId)
  return unwrap(api.delete<ApiResponse<{ linkId: number; revoked: boolean }>>(`/share-links/${linkId}`))
}

// GET /share/{token} — 공개 보기 전용 (비인증). 410(SHARE_001) → Error('SHARE_001')로 정규화.
export function getPublicShare(token: string): Promise<PublicShare> {
  if (MOCK) return mock.getPublicShare(token)
  return unwrap(api.get<ApiResponse<PublicShare>>(`/share/${token}`)).catch((err: unknown) => {
    if (err instanceof AxiosError && err.response?.status === 410) {
      throw new Error(SHARE_EXPIRED)
    }
    throw err
  })
}

// GET /recommendations/{id}/shopping-list — 구매 목록 내보내기
export function getShoppingList(recommendationId: number): Promise<ShoppingList> {
  if (MOCK) return mock.getShoppingList(recommendationId)
  return unwrap(
    api.get<ApiResponse<ShoppingList>>(`/recommendations/${recommendationId}/shopping-list`),
  )
}
