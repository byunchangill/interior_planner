// accessToken/refreshToken localStorage 저장소 (계약 토큰 정책)
import type { TokenPair } from '../types/auth'

const ACCESS = 'accessToken'
const REFRESH = 'refreshToken'

export const getAccessToken = () => localStorage.getItem(ACCESS)
export const getRefreshToken = () => localStorage.getItem(REFRESH)

export function saveTokens({ accessToken, refreshToken }: TokenPair) {
  localStorage.setItem(ACCESS, accessToken)
  localStorage.setItem(REFRESH, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}
