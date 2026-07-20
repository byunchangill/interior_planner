import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type {
  AnalysisRequest,
  AnalysisCreated,
  AnalysisStatus,
  Recommendation,
  Visuals,
} from '../types/reco'

// POST /analyses — 공간 분석 비동기 실행 (RECO-001/002). 202 + analysisId
export function createAnalysis(body: AnalysisRequest): Promise<AnalysisCreated> {
  return unwrap(api.post<ApiResponse<AnalysisCreated>>('/analyses', body))
}

// GET /analyses/{id} — 분석 상태 폴링 (RECO-003)
export function getAnalysis(analysisId: number): Promise<AnalysisStatus> {
  return unwrap(api.get<ApiResponse<AnalysisStatus>>(`/analyses/${analysisId}`))
}

// GET /recommendations/{id} — 추천안 상세 (RECO-004/005). 8섹션 + 새 필드
export function getRecommendation(recommendationId: number): Promise<Recommendation> {
  return unwrap(api.get<ApiResponse<Recommendation>>(`/recommendations/${recommendationId}`))
}

// GET /recommendations/{id}/visuals — 전후 비교 이미지 (RECO-006)
export function getVisuals(recommendationId: number): Promise<Visuals> {
  return unwrap(api.get<ApiResponse<Visuals>>(`/recommendations/${recommendationId}/visuals`))
}

// POST /recommendations/{id}/visuals/regenerate — 시각화 재생성(스텁). 202
export function regenerateVisuals(recommendationId: number): Promise<{ status: string }> {
  return unwrap(
    api.post<ApiResponse<{ status: string }>>(`/recommendations/${recommendationId}/visuals/regenerate`),
  )
}
