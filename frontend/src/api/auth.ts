import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type { AuthResult, LoginRequest, SignupRequest, User } from '../types/auth'
import { saveTokens, clearTokens } from './tokens'

// POST /auth/signup — 약관 동의 포함 원스텝 회원가입 (인증 불필요)
export async function signup(body: SignupRequest): Promise<AuthResult> {
  const result = await unwrap(api.post<ApiResponse<AuthResult>>('/auth/signup', body))
  saveTokens(result)
  return result
}

// POST /auth/login — 이메일 로그인 (인증 불필요)
export async function login(body: LoginRequest): Promise<AuthResult> {
  const result = await unwrap(api.post<ApiResponse<AuthResult>>('/auth/login', body))
  saveTokens(result)
  return result
}

// GET /auth/me — 저장된 accessToken으로 현재 사용자 조회 (스플래시 세션 확인)
export function getMe(): Promise<User> {
  return unwrap(api.get<ApiResponse<User>>('/auth/me'))
}

export function logout() {
  clearTokens()
}
