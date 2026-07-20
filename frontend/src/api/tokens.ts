// accessToken localStorage 저장소. refreshToken 은 httpOnly 쿠키(서버 관리)로 이동 — JS 접근 불가.
const ACCESS = 'accessToken'

export const getAccessToken = () => localStorage.getItem(ACCESS)

export const saveAccessToken = (accessToken: string) => localStorage.setItem(ACCESS, accessToken)

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem('refreshToken') // 쿠키 전환 이전 localStorage 잔재 정리
}
