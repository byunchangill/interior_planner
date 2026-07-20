import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type { HomeSummary, StyleDetail, StyleListItem, StyleType } from '../types/home'

// GET /home/summary — 홈 진입 데이터 (인증 필요)
export function getHomeSummary(): Promise<HomeSummary> {
  return unwrap(api.get<ApiResponse<HomeSummary>>('/home/summary'))
}

// GET /styles — 스타일 갤러리 목록 (인증 불필요). data.items 배열을 반환.
export function getStyles(): Promise<StyleListItem[]> {
  return unwrap(api.get<ApiResponse<{ items: StyleListItem[] }>>('/styles')).then((d) => d.items)
}

// GET /styles/{styleType} — 스타일 상세 (인증 불필요)
export function getStyleDetail(styleType: StyleType | string): Promise<StyleDetail> {
  return unwrap(api.get<ApiResponse<StyleDetail>>(`/styles/${styleType}`))
}
