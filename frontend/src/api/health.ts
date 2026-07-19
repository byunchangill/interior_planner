import { api, unwrap } from './client'
import type { ApiResponse, HealthStatus } from '../types/common'

// GET /api/v1/health — 스캐폴딩 연동 확인용 헬스체크 (M0 계약, 인증 불필요)
export function getHealth(): Promise<HealthStatus> {
  return unwrap<HealthStatus>(api.get<ApiResponse<HealthStatus>>('/health'))
}
