// 소셜 로그인 인가 URL 조립. client_id/REST API 키는 공개 값(OAuth authorize 요청에 그대로 노출되는 값)이라
// 프론트에 두는 것이 정상 — 시크릿(client_secret)은 백엔드(oauth.*.client-secret)에만 있다.
const KAKAO_CLIENT_ID = '59c02ba59cebcacb9bf90f0dd7108df3'
const GOOGLE_CLIENT_ID = '354603150582-88ri93or6iin60e3horlvumbeidujov0.apps.googleusercontent.com'

export function kakaoAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: `${window.location.origin}/oauth/callback/kakao`,
    response_type: 'code',
  })
  return `https://kauth.kakao.com/oauth/authorize?${params}`
}

export function googleAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/oauth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
