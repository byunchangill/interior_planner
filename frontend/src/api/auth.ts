import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type { AuthResult, LoginRequest, SignupRequest, User } from '../types/auth'
import { saveAccessToken, clearTokens } from './tokens'

// POST /auth/signup — 약관 동의 포함 원스텝 회원가입 (인증 불필요)
export async function signup(body: SignupRequest): Promise<AuthResult> {
  const result = await unwrap(api.post<ApiResponse<AuthResult>>('/auth/signup', body))
  saveAccessToken(result.accessToken)
  return result
}

// POST /auth/login — 이메일 로그인 (인증 불필요)
export async function login(body: LoginRequest): Promise<AuthResult> {
  const result = await unwrap(api.post<ApiResponse<AuthResult>>('/auth/login', body))
  saveAccessToken(result.accessToken)
  return result
}

// GET /auth/me — 저장된 accessToken으로 현재 사용자 조회 (스플래시 세션 확인)
export function getMe(): Promise<User> {
  return unwrap(api.get<ApiResponse<User>>('/auth/me'))
}

// POST /auth/kakao, /auth/google — 인가 코드 교환 (OAuthCallbackPage 에서 호출)
export async function socialLogin(
  provider: 'kakao' | 'google',
  code: string,
): Promise<AuthResult> {
  const result = await unwrap(api.post<ApiResponse<AuthResult>>(`/auth/${provider}`, { code }))
  saveAccessToken(result.accessToken)
  return result
}

export async function logout() {
  // 서버 refreshToken 폐기 + httpOnly 쿠키 삭제. 호출이 끝나기 전에 clearTokens 하면
  // 인터셉터가 Authorization 헤더를 못 붙여 401이 나므로 반드시 완료를 기다린다.
  try {
    await api.post('/auth/logout')
  } catch {
    // 서버 폐기 실패(만료 등)해도 로컬 정리는 진행
  }
  clearTokens()
}
