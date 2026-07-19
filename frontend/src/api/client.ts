import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse } from '../types/common'

// 단일 axios 인스턴스. baseURL은 계약 표준(/api/v1).
// dev 환경에서는 vite proxy가 /api → http://localhost:8080 으로 전달.
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── 요청 인터셉터: accessToken 첨부 ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ── 응답 인터셉터: 401 시 refresh 재시도 자리(M0 스텁) ───────────
// M1에서 /api/v1/auth/refresh 연동으로 채운다. 지금은 토큰 정리 후 원본 에러 전파.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // TODO(M1): refresh 토큰으로 accessToken 재발급 후 원 요청 재시도
      // localStorage.removeItem('accessToken')
    }
    return Promise.reject(error)
  },
)

/**
 * ApiResponse<T> 래퍼에서 data만 꺼내는 헬퍼.
 * 페이지에는 도메인 타입(T)만 노출되도록 API 함수 안에서 사용한다.
 */
export async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const res = await promise
  const body = res.data
  if (!body.success) {
    throw new Error(body.error?.message ?? 'API 요청 실패')
  }
  return body.data
}
