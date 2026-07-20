// M2 SPACE 프리뷰용 mock — 계약(m2.md) shape 그대로. VITE_USE_MOCK=true 일 때만 사용.
// 실제 백엔드 연동 시 이 파일은 무시된다(api/space.ts의 MOCK 스위치 off).
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
} from '../../types/space'
import { SPACE_TYPE_LABELS } from '../../types/space'

const delay = <T>(v: T, ms = 300): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), ms))

let seq = 100
const store: Record<number, SpaceDetail> = {
  1: {
    spaceId: 1,
    spaceType: 'LIVING_ROOM',
    name: '거실',
    photos: [{ photoId: 10, url: 'https://placehold.co/600x400/e2dfff/3525cd?text=Living+Room', isFloorPlan: false }],
    dimensions: {
      widthM: 4.2, depthM: 3.5, heightM: 2.3, areaPyeong: 4.4,
      confidence: 'MEDIUM', isUserVerified: false,
      openings: [{ openingId: 1, type: 'WINDOW', wall: 'NORTH', widthM: 1.8 }],
    },
    furniture: [{ furnitureId: 20, type: 'SOFA', label: '3인용 소파', keep: false, source: 'AI_DETECTED' }],
  },
  2: {
    spaceId: 2, spaceType: 'BEDROOM', name: '안방',
    photos: [], dimensions: null, furniture: [],
  },
}

export const getSpaces = (): Promise<SpaceListItem[]> =>
  delay(
    Object.values(store).map((s) => ({
      spaceId: s.spaceId,
      spaceType: s.spaceType,
      name: s.name,
      photoCount: s.photos.filter((p) => !p.isFloorPlan).length,
      thumbnailUrl: s.photos.find((p) => !p.isFloorPlan)?.url ?? null,
      createdAt: '2026-07-20T10:00:00Z',
    })),
  )

export const createSpace = (body: { spaceType: SpaceType; name?: string }): Promise<SpaceCreated> => {
  const spaceId = ++seq
  store[spaceId] = {
    spaceId, spaceType: body.spaceType,
    name: body.name || SPACE_TYPE_LABELS[body.spaceType],
    photos: [], dimensions: null, furniture: [],
  }
  return delay({ ...store[spaceId], photoCount: 0, createdAt: new Date().toISOString() })
}

export const getSpace = (spaceId: number): Promise<SpaceDetail> => {
  const s = store[spaceId]
  if (!s) return Promise.reject(new Error('공간을 찾을 수 없습니다'))
  return delay(structuredClone(s))
}

export const deleteSpace = (spaceId: number): Promise<{ spaceId: number }> => {
  delete store[spaceId]
  return delay({ spaceId })
}

export const uploadPhoto = (
  spaceId: number,
  file: File,
  isFloorPlan: boolean,
): Promise<PhotoUploadResult> => {
  const s = store[spaceId]
  const photoId = ++seq
  const url = URL.createObjectURL(file)
  s.photos.push({ photoId, url, isFloorPlan })
  // 최초 사진에서만 Mock AI 치수·가구 생성
  const isFirst = s.photos.filter((p) => !p.isFloorPlan).length === 1 && !isFloorPlan
  if (isFirst) {
    s.dimensions = {
      widthM: 4.2, depthM: 3.5, heightM: 2.3, areaPyeong: 4.4,
      confidence: 'MEDIUM', isUserVerified: false,
      openings: [{ openingId: ++seq, type: 'WINDOW', wall: 'NORTH', widthM: 1.8 }],
    }
    s.furniture = [{ furnitureId: ++seq, type: 'SOFA', label: '3인용 소파', keep: false, source: 'AI_DETECTED' }]
  }
  return delay({
    photoId, url, isFloorPlan, qualityCheck: 'PASSED',
    detectedFurniture: isFirst
      ? s.furniture.map((f) => ({ furnitureId: f.furnitureId!, type: f.type, label: f.label }))
      : [],
  })
}

export const deletePhoto = (spaceId: number, photoId: number): Promise<{ photoId: number }> => {
  const s = store[spaceId]
  s.photos = s.photos.filter((p) => p.photoId !== photoId)
  return delay({ photoId })
}

export const patchDimensions = (
  spaceId: number,
  body: DimensionsUpdate,
): Promise<DimensionsResult> => {
  const s = store[spaceId]
  const heightM = body.heightM ?? 2.3
  const areaPyeong = Math.round((body.widthM * body.depthM) / 3.3058 * 10) / 10
  const openings = (body.openings ?? s.dimensions?.openings ?? []).map((o, i) => ({
    openingId: i + 1, ...o,
  }))
  s.dimensions = {
    widthM: body.widthM, depthM: body.depthM, heightM, areaPyeong,
    confidence: s.dimensions?.confidence ?? 'MEDIUM',
    isUserVerified: body.isUserVerified, openings,
  }
  return delay({
    spaceId, widthM: body.widthM, depthM: body.depthM, heightM, areaPyeong,
    isUserVerified: body.isUserVerified, openings,
  })
}

export const putFurniture = (spaceId: number, body: FurnitureUpdate): Promise<Furniture[]> => {
  const s = store[spaceId]
  s.furniture = body.furniture.map((f) => ({
    furnitureId: f.furnitureId ?? ++seq,
    type: f.type, label: f.label, keep: f.keep,
    source: f.furnitureId ? 'AI_DETECTED' : 'USER_ADDED',
  }))
  return delay(structuredClone(s.furniture))
}
