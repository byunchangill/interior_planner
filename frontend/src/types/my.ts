// MY/DATA 도메인 타입 — _workspace/contracts/m5.md 기준

// GET /me/profile
export interface Consents {
  termsOfService: boolean
  privacyPolicy: boolean
  imageProcessing: boolean
  marketing: boolean
}
export interface ProfileStats {
  spaceCount: number
  savedRecommendationCount: number
  photoCount: number
}
export interface Profile {
  userId: number
  email: string
  nickname: string
  consents: Consents
  stats: ProfileStats
}

// PATCH /me
export interface ProfileUpdate {
  userId: number
  nickname: string
  marketing: boolean
}

// GET /me/images
export interface UploadedImage {
  photoId: number
  spaceId: number
  spaceName: string
  url: string
  isFloorPlan: boolean
  uploadedAt: string
}

// DELETE /me/images
export interface DeleteImagesRequest {
  imageIds?: number[]
  deleteAll: boolean
  keepResults: boolean
  confirmShareRevoke: boolean
}
export interface DeleteImagesResult {
  deletedCount: number
  revokedShareLinks: number
  deletedRecommendations: number
}

// 계약 §에러 코드
export const ERR = {
  AUTH_001: 'AUTH_001', // 비밀번호 불일치
  AUTH_003: 'AUTH_003', // 타인 이미지
  RES_001: 'RES_001', // 리소스 없음
  VALID_001: 'VALID_001', // 입력값 누락/형식
  SHARE_002: 'SHARE_002', // 원본 포함 공유링크 존재 → 회수 확인 필요
  AI_005: 'AI_005', // 분석 진행 중 충돌
} as const
