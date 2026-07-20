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

// v1엔 실제 스타일 이미지가 없어 스타일별 브랜드 그라디언트를 placeholder로 사용한다(실 이미지 확보 시 교체).
// 앱 전역 단일 팔레트 — 디자인 토큰(DESIGN.md) 색상 기반. inline `style={{ background }}`로 사용.
// reco/save 도메인은 이 상수를 re-export해 재사용한다.
export const STYLE_GRADIENTS: Record<StyleType, string> = {
  MODERN: 'linear-gradient(135deg,#2e3132,#464555)',
  MINIMAL: 'linear-gradient(135deg,#e1e3e4,#c7c4d8)',
  NATURAL: 'linear-gradient(135deg,#85f8c4,#68dba9)',
  NORDIC: 'linear-gradient(135deg,#e2dfff,#c3c0ff)',
  HOTEL: 'linear-gradient(135deg,#703a00,#934e00)',
  WOOD: 'linear-gradient(135deg,#ffdcc3,#ffb77d)',
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
