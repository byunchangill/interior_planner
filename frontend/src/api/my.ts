import { api, unwrap } from './client'
import type { ApiResponse } from '../types/common'
import type {
  Profile,
  ProfileUpdate,
  UploadedImage,
  DeleteImagesRequest,
  DeleteImagesResult,
} from '../types/my'

// GET /me/profile — 마이페이지 프로필 + 요약 통계 (MY-001)
export function getProfile(): Promise<Profile> {
  return unwrap(api.get<ApiResponse<Profile>>('/me/profile'))
}

// PATCH /me — 닉네임·마케팅 동의 변경 (MY-003). 전달된 필드만 수정
export function updateProfile(body: {
  nickname?: string
  marketing?: boolean
}): Promise<ProfileUpdate> {
  return unwrap(api.patch<ApiResponse<ProfileUpdate>>('/me', body))
}

// GET /me/images — 업로드 원본 전체 조회 (MY-002)
export function getImages(): Promise<UploadedImage[]> {
  return unwrap(api.get<ApiResponse<{ items: UploadedImage[] }>>('/me/images')).then((d) => d.items)
}

// DELETE /me/images — 원본 삭제 개별/일괄 (MY-002)
// axios delete는 body를 config.data로 전달. 4xx면 AxiosError(code 포함)가 그대로 전파된다.
export function deleteImages(body: DeleteImagesRequest): Promise<DeleteImagesResult> {
  return unwrap(api.delete<ApiResponse<DeleteImagesResult>>('/me/images', { data: body }))
}

// DELETE /me — 회원 탈퇴 (MY-004). 비밀번호 재확인 필수
export function deleteAccount(password: string): Promise<{ deleted: boolean }> {
  return unwrap(api.delete<ApiResponse<{ deleted: boolean }>>('/me', { data: { password } }))
}
