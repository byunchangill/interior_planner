// AUTH 도메인 타입 — _workspace/contracts/m1.md 기준

export interface User {
  userId: number
  email: string
  nickname: string
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: User
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// POST /auth/signup 요청의 consents 블록 (필수 3개 + 선택 마케팅)
export interface Consents {
  termsOfService: boolean
  privacyPolicy: boolean
  imageProcessing: boolean
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
