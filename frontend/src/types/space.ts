// SPACE 도메인 타입 — _workspace/contracts/m2.md 기준

// ── Enums (계약 §Enums) ──────────────────────────────────────────
export type SpaceType = 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'STUDY' | 'ETC'
export type FurnitureType =
  | 'SOFA' | 'BED' | 'TABLE' | 'CHAIR' | 'WARDROBE'
  | 'BOOKSHELF' | 'TV_STAND' | 'DRAWER' | 'LIGHTING' | 'ETC'
export type OpeningType = 'WINDOW' | 'DOOR'
export type Wall = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'
export type FurnitureSource = 'AI_DETECTED' | 'USER_ADDED'
export type QualityCheck = 'PASSED' | 'LOW_LIGHT' | 'BLURRY' | 'NOT_RECOGNIZED'

// ── 한글 라벨 / 아이콘 매핑 (디자인 이식용) ───────────────────────
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  LIVING_ROOM: '거실',
  BEDROOM: '침실',
  KITCHEN: '주방',
  STUDY: '서재',
  ETC: '기타',
}
export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  LIVING_ROOM: 'chair',
  BEDROOM: 'bed',
  KITCHEN: 'cooking',
  STUDY: 'laptop_mac',
  ETC: 'add_circle',
}
export const SPACE_TYPES = Object.keys(SPACE_TYPE_LABELS) as SpaceType[]

export const FURNITURE_TYPE_LABELS: Record<FurnitureType, string> = {
  SOFA: '소파',
  BED: '침대',
  TABLE: '테이블',
  CHAIR: '의자',
  WARDROBE: '옷장',
  BOOKSHELF: '책장',
  TV_STAND: 'TV장',
  DRAWER: '서랍장',
  LIGHTING: '조명',
  ETC: '기타',
}
export const FURNITURE_TYPES = Object.keys(FURNITURE_TYPE_LABELS) as FurnitureType[]

export const OPENING_TYPE_LABELS: Record<OpeningType, string> = {
  WINDOW: '창문',
  DOOR: '문',
}
export const WALL_LABELS: Record<Wall, string> = {
  NORTH: '북쪽', SOUTH: '남쪽', EAST: '동쪽', WEST: '서쪽',
}
export const WALLS = Object.keys(WALL_LABELS) as Wall[]

// 신뢰도 뱃지 색상 (라벨 + Tailwind 클래스)
export const CONFIDENCE_META: Record<Confidence, { label: string; cls: string }> = {
  HIGH: { label: '높음', cls: 'bg-secondary-container text-on-secondary-container' },
  MEDIUM: { label: '보통', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  LOW: { label: '낮음', cls: 'bg-error-container text-on-error-container' },
}

// ── 응답 타입 ────────────────────────────────────────────────────
export interface SpaceListItem {
  spaceId: number
  spaceType: SpaceType
  name: string
  photoCount: number
  thumbnailUrl: string | null
  createdAt: string
}

// POST /spaces 응답
export interface SpaceCreated {
  spaceId: number
  spaceType: SpaceType
  name: string
  photoCount: number
  createdAt: string
}

export interface Photo {
  photoId: number
  url: string
  isFloorPlan: boolean
}

export interface Opening {
  openingId?: number
  type: OpeningType
  wall: Wall
  widthM: number
}

export interface Dimensions {
  widthM: number
  depthM: number
  heightM: number
  areaPyeong: number
  confidence: Confidence
  isUserVerified: boolean
  openings: Opening[]
}

export interface Furniture {
  furnitureId?: number
  type: FurnitureType
  label: string
  keep: boolean
  source?: FurnitureSource
}

// GET /spaces/{id}
export interface SpaceDetail {
  spaceId: number
  spaceType: SpaceType
  name: string
  photos: Photo[]
  dimensions: Dimensions | null
  furniture: Furniture[]
}

// POST /spaces/{id}/photos
export interface PhotoUploadResult {
  photoId: number
  url: string
  isFloorPlan: boolean
  qualityCheck: QualityCheck
  detectedFurniture: { furnitureId: number; type: FurnitureType; label: string }[]
}

// PATCH /spaces/{id}/dimensions 요청/응답
export interface DimensionsUpdate {
  widthM: number
  depthM: number
  heightM: number | null
  isUserVerified: boolean
  openings?: Omit<Opening, 'openingId'>[]
}
export interface DimensionsResult {
  spaceId: number
  widthM: number
  depthM: number
  heightM: number
  areaPyeong: number
  isUserVerified: boolean
  openings: Opening[]
}

// PUT /spaces/{id}/furniture 요청/응답
export interface FurnitureUpdate {
  furniture: { furnitureId?: number; type: FurnitureType; label: string; keep: boolean }[]
}
