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
