import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type {
  SpaceListItem,
  SpaceCreated,
  SpaceDetail,
  SpaceType,
  PhotoUploadResult,
  DimensionsUpdate,
  DimensionsResult,
  FurnitureUpdate,
  Furniture,
} from '../types/space'
import * as mock from './mock/space'

// 백엔드 미완성 시 프리뷰용 mock 스위치. `VITE_USE_MOCK=true` 로 켠다.
// 실제 연동은 기본값(off). mock 데이터는 api/mock/space.ts 한 곳에만 존재.
const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// GET /spaces — 내 공간 목록 (SPACE-001). data.items 반환
export function getSpaces(): Promise<SpaceListItem[]> {
  if (MOCK) return mock.getSpaces()
  return unwrap(api.get<ApiResponse<{ items: SpaceListItem[] }>>('/spaces')).then((d) => d.items)
}

// POST /spaces — 공간 생성 (SPACE-002)
export function createSpace(body: { spaceType: SpaceType; name?: string }): Promise<SpaceCreated> {
  if (MOCK) return mock.createSpace(body)
  return unwrap(api.post<ApiResponse<SpaceCreated>>('/spaces', body))
}

// GET /spaces/{id} — 공간 상세 (SPACE-007)
export function getSpace(spaceId: number): Promise<SpaceDetail> {
  if (MOCK) return mock.getSpace(spaceId)
  return unwrap(api.get<ApiResponse<SpaceDetail>>(`/spaces/${spaceId}`))
}

// DELETE /spaces/{id} — 공간 삭제
export function deleteSpace(spaceId: number): Promise<{ spaceId: number }> {
  if (MOCK) return mock.deleteSpace(spaceId)
  return unwrap(api.delete<ApiResponse<{ spaceId: number }>>(`/spaces/${spaceId}`))
}

// POST /spaces/{id}/photos — 사진/도면 등록 (SPACE-003/004). multipart
export function uploadPhoto(
  spaceId: number,
  file: File,
  isFloorPlan = false,
): Promise<PhotoUploadResult> {
  if (MOCK) return mock.uploadPhoto(spaceId, file, isFloorPlan)
  const form = new FormData()
  form.append('file', file)
  form.append('isFloorPlan', String(isFloorPlan))
  return unwrap(
    api.post<ApiResponse<PhotoUploadResult>>(`/spaces/${spaceId}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  )
}

// DELETE /spaces/{id}/photos/{photoId}
export function deletePhoto(spaceId: number, photoId: number): Promise<{ photoId: number }> {
  if (MOCK) return mock.deletePhoto(spaceId, photoId)
  return unwrap(api.delete<ApiResponse<{ photoId: number }>>(`/spaces/${spaceId}/photos/${photoId}`))
}

// PATCH /spaces/{id}/dimensions — 치수 확인·수정 (SPACE-005)
export function patchDimensions(
  spaceId: number,
  body: DimensionsUpdate,
): Promise<DimensionsResult> {
  if (MOCK) return mock.patchDimensions(spaceId, body)
  return unwrap(api.patch<ApiResponse<DimensionsResult>>(`/spaces/${spaceId}/dimensions`, body))
}

// PUT /spaces/{id}/furniture — 기존 가구 목록 갱신 (SPACE-006)
export function putFurniture(spaceId: number, body: FurnitureUpdate): Promise<Furniture[]> {
  if (MOCK) return mock.putFurniture(spaceId, body)
  return unwrap(
    api.put<ApiResponse<{ furniture: Furniture[] }>>(`/spaces/${spaceId}/furniture`, body),
  ).then((d) => d.furniture)
}
