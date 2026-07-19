// 공통 API 응답 타입 — api-contract-guide.md 표준 (ApiResponse 포맷)
// M0 계약: { success, data } / 에러 시 error 포함

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
}

// GET /api/v1/health 응답 (M0 계약)
export interface HealthStatus {
  status: string
  service: string
  timestamp: string
}
