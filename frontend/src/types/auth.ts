// AUTH 도메인 타입 — _workspace/contracts/m1.md 기준

export interface User {
  userId: number
  email: string
  nickname: string
}

// refreshToken 은 httpOnly 쿠키로만 오간다 — 응답 본문·FE 저장소에 없음
export interface AuthResult {
  accessToken: string
  user: User
}

// POST /auth/signup 요청의 consents 블록
// 필수: termsOfService·privacyPolicy·imageProcessing / 선택: aiTraining·marketing
export interface Consents {
  termsOfService: boolean
  privacyPolicy: boolean
  imageProcessing: boolean
  aiTraining: boolean
  marketing: boolean
}

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  consents: Consents
}

export interface LoginRequest {
  email: string
  password: string
}
