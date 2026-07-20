import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse } from '../types/common'
import { getAccessToken, saveAccessToken, clearTokens } from './tokens'

// 단일 axios 인스턴스. baseURL은 계약 표준(/api/v1).
// dev 환경에서는 vite proxy가 /api → http://localhost:8080 으로 전달.
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── 요청 인터셉터: accessToken 첨부 ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// 재시도 1회 플래그를 얹기 위한 config 확장
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function goToLogin() {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ── 응답 인터셉터: 401 시 /auth/refresh 1회 재시도 ───────────────
// refreshToken 은 httpOnly 쿠키로 자동 전송된다(본문 없음). 성공 시 새 accessToken 저장 후
// 원 요청 재시도, 실패 시 토큰 삭제 후 로그인 이동.
// refresh 호출은 인터셉터가 없는 bare axios로 보내 재귀를 피한다.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const url = original?.url ?? ''
    // 로그인/가입의 401은 자격 증명 오류이지 세션 만료가 아니다 — refresh 대상 제외
    const refreshable =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !!getAccessToken() &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/signup')

    if (!refreshable) {
      if (error.response?.status === 401 && !getAccessToken()) goToLogin()
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const res = await axios.post<ApiResponse<{ accessToken: string }>>(
        '/api/v1/auth/refresh',
        {},
      )
      const { accessToken } = res.data.data
      saveAccessToken(accessToken)
      original.headers.set('Authorization', `Bearer ${accessToken}`)
      return api(original)
    } catch (refreshErr) {
      goToLogin()
      return Promise.reject(refreshErr)
    }
  },
)

/**
 * AxiosError 응답 본문에서 계약 에러코드(error.code)를 꺼낸다.
 * 4xx면 axios가 reject → unwrap의 await가 AxiosError를 그대로 던지므로 code가 살아있다.
 * (SHARE_002/AI_005/AUTH_001 등 코드별 분기가 필요한 페이지에서 사용)
 */
export function apiErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code
  }
  return undefined
}

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
