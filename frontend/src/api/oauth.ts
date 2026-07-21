// 소셜 로그인 인가 URL 조립. client_id/REST API 키는 공개 값(OAuth authorize 요청에 그대로 노출되는 값)이라
// 프론트에 두는 것이 정상 — 시크릿(client_secret)은 백엔드(oauth.*.client-secret)에만 있다.
const KAKAO_CLIENT_ID = '59c02ba59cebcacb9bf90f0dd7108df3'
const GOOGLE_CLIENT_ID = '354603150582-88ri93or6iin60e3horlvumbeidujov0.apps.googleusercontent.com'

// 로그인 CSRF 방지용 state. authorize 요청 시 랜덤값을 생성해 sessionStorage 에 저장하고,
// 콜백(OAuthCallbackPage)에서 쿼리의 state 와 대조해 일치할 때만 인가 코드를 신뢰한다.
// (state 없이는 공격자가 자신의 인가 코드를 피해자 브라우저에 흘려보내 피해자를 공격자 계정으로 로그인시킬 수 있음)
const STATE_KEY = 'oauthState'

function newState(): string {
  const state = crypto.randomUUID()
  sessionStorage.setItem(STATE_KEY, state)
  return state
}

/** 콜백에서 1회 호출 — 저장된 state 와 대조 후 즉시 폐기(재사용 방지). */
export function consumeOAuthState(received: string | null): boolean {
  const expected = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  return expected !== null && received !== null && expected === received
}

export function kakaoAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: `${window.location.origin}/oauth/callback/kakao`,
    response_type: 'code',
    state: newState(),
  })
  return `https://kauth.kakao.com/oauth/authorize?${params}`
}

export function googleAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/oauth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    state: newState(),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
