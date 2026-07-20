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

// GET /saved — 보관함 목록 (SAVE-001)
export function getSaved(): Promise<SavedItem[]> {
  return unwrap(api.get<ApiResponse<{ items: SavedItem[] }>>('/saved')).then((d) => d.items)
}

// POST /recommendations/{id}/save — 저장
export function save(recommendationId: number): Promise<SaveToggle> {
  return unwrap(api.post<ApiResponse<SaveToggle>>(`/recommendations/${recommendationId}/save`))
}

// DELETE /recommendations/{id}/save — 저장 해제
export function unsave(recommendationId: number): Promise<SaveToggle> {
  return unwrap(api.delete<ApiResponse<SaveToggle>>(`/recommendations/${recommendationId}/save`))
}

// PUT /recommendations/{id}/select — "이 안으로 결정" (같은 공간 단일 대표)
export function select(recommendationId: number): Promise<SelectToggle> {
  return unwrap(api.put<ApiResponse<SelectToggle>>(`/recommendations/${recommendationId}/select`))
}

// POST /recommendations/compare — 비교 (SAVE-002)
export function compare(recommendationIds: number[], compareKey: CompareKey): Promise<CompareResult> {
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
  return unwrap(
    api.post<ApiResponse<ShareLinkCreated>>(`/recommendations/${recommendationId}/share-links`, {
      expiresIn,
      includeOriginalPhotos,
    }),
  )
}

// GET /recommendations/{id}/share-links — 링크 목록/관리
export function getShareLinks(recommendationId: number): Promise<ShareLink[]> {
  return unwrap(
    api.get<ApiResponse<{ items: ShareLink[] }>>(`/recommendations/${recommendationId}/share-links`),
  ).then((d) => d.items)
}

// DELETE /share-links/{linkId} — 링크 회수
export function revokeShareLink(linkId: number): Promise<{ linkId: number; revoked: boolean }> {
  return unwrap(api.delete<ApiResponse<{ linkId: number; revoked: boolean }>>(`/share-links/${linkId}`))
}

// GET /share/{token} — 공개 보기 전용 (비인증). 410(SHARE_001) → Error('SHARE_001')로 정규화.
export function getPublicShare(token: string): Promise<PublicShare> {
  return unwrap(api.get<ApiResponse<PublicShare>>(`/share/${token}`)).catch((err: unknown) => {
    if (err instanceof AxiosError && err.response?.status === 410) {
      throw new Error(SHARE_EXPIRED)
    }
    throw err
  })
}

// GET /recommendations/{id}/shopping-list — 구매 목록 내보내기
export function getShoppingList(recommendationId: number): Promise<ShoppingList> {
  return unwrap(
    api.get<ApiResponse<ShoppingList>>(`/recommendations/${recommendationId}/shopping-list`),
  )
}
