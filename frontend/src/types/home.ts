// HOME 도메인 타입 — _workspace/contracts/m1.md 기준

// 계약 Enums: StyleType
export type StyleType = 'MODERN' | 'MINIMAL' | 'NATURAL' | 'NORDIC' | 'HOTEL' | 'WOOD'

// 갤러리 필터 칩 / 상세 라벨용 한글 매핑
export const STYLE_LABELS: Record<StyleType, string> = {
  MODERN: '모던',
  MINIMAL: '미니멀',
  NATURAL: '내추럴',
  NORDIC: '노르딕',
  HOTEL: '호텔',
  WOOD: '우드톤',
}

export const STYLE_TYPES = Object.keys(STYLE_LABELS) as StyleType[]

// v1엔 실제 스타일 이미지가 없어 스타일별 브랜드 그라디언트를 placeholder로 사용한다.
// (실 이미지 확보 시 배경 이미지로 교체) — 클래스는 JIT가 인식하도록 리터럴로 둔다.
export const STYLE_GRADIENT: Record<StyleType, string> = {
  MODERN: 'bg-gradient-to-br from-slate-500 to-slate-800',
  MINIMAL: 'bg-gradient-to-br from-neutral-300 to-neutral-500',
  NATURAL: 'bg-gradient-to-br from-emerald-300 to-teal-600',
  NORDIC: 'bg-gradient-to-br from-sky-300 to-indigo-500',
  HOTEL: 'bg-gradient-to-br from-amber-600 to-neutral-800',
  WOOD: 'bg-gradient-to-br from-amber-500 to-amber-800',
}

export interface RecentSpace {
  spaceId: number
  name: string
  thumbnailUrl: string
}

export interface StyleHighlight {
  styleType: StyleType
  title: string
  thumbnailUrl: string
}

// GET /home/summary
export interface HomeSummary {
  nickname: string
  recentSpaces: RecentSpace[]
  styleHighlights: StyleHighlight[]
}

// GET /styles 항목
export interface StyleListItem {
  styleType: StyleType
  title: string
  thumbnailUrl: string
  description: string
}

export interface StyleGalleryImage {
  imageUrl: string
  caption: string
}

// GET /styles/{styleType}
export interface StyleDetail {
  styleType: StyleType
  title: string
  description: string
  keywords: string[]
  gallery: StyleGalleryImage[]
}
