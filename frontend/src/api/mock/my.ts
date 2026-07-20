// M5 MY/DATA 프리뷰용 mock — 계약(m5.md) shape 그대로. VITE_USE_MOCK=true 일 때만 사용.
import type {
  Profile,
  ProfileUpdate,
  UploadedImage,
  DeleteImagesRequest,
  DeleteImagesResult,
} from '../../types/my'
import { ERR } from '../../types/my'

const delay = <T>(v: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))
const fail = (code: string, message: string, ms = 300): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(message), { code })), ms))

let profile: Profile = {
  userId: 1,
  email: 'user@example.com',
  nickname: '홈스타일러',
  consents: { termsOfService: true, privacyPolicy: true, imageProcessing: true, marketing: false },
  stats: { spaceCount: 2, savedRecommendationCount: 3, photoCount: 7 },
}

let images: UploadedImage[] = [
  { photoId: 10, spaceId: 1, spaceName: '거실', url: '', isFloorPlan: false, uploadedAt: '2026-07-20T10:00:00Z' },
  { photoId: 11, spaceId: 1, spaceName: '거실', url: '', isFloorPlan: true, uploadedAt: '2026-07-20T10:01:00Z' },
  { photoId: 12, spaceId: 1, spaceName: '거실', url: '', isFloorPlan: false, uploadedAt: '2026-07-19T09:00:00Z' },
  { photoId: 20, spaceId: 2, spaceName: '침실', url: '', isFloorPlan: false, uploadedAt: '2026-07-18T15:30:00Z' },
  { photoId: 21, spaceId: 2, spaceName: '침실', url: '', isFloorPlan: false, uploadedAt: '2026-07-18T15:31:00Z' },
]

// 원본이 공유링크에 포함되어 있다고 가정하는 사진(SHARE_002 선차단 시나리오 재현용)
const SHARED_PHOTO_IDS = new Set([10])

export const getProfile = (): Promise<Profile> => delay({ ...profile })

export const updateProfile = (body: {
  nickname?: string
  marketing?: boolean
}): Promise<ProfileUpdate> => {
  if (body.nickname !== undefined) profile.nickname = body.nickname
  if (body.marketing !== undefined) profile.consents.marketing = body.marketing
  return delay({ userId: profile.userId, nickname: profile.nickname, marketing: profile.consents.marketing })
}

export const getImages = (): Promise<UploadedImage[]> => delay([...images])

export const deleteImages = (body: DeleteImagesRequest): Promise<DeleteImagesResult> => {
  const targets = body.deleteAll ? images.map((i) => i.photoId) : body.imageIds ?? []
  if (targets.length === 0) return fail(ERR.VALID_001, '삭제 대상을 선택해 주세요.')

  const hasShared = targets.some((id) => SHARED_PHOTO_IDS.has(id))
  if (hasShared && !body.confirmShareRevoke) {
    return fail(ERR.SHARE_002, '원본이 포함된 공유 링크가 존재합니다.')
  }

  const revoked = hasShared ? 1 : 0
  images = images.filter((i) => !targets.includes(i.photoId))
  profile = { ...profile, stats: { ...profile.stats, photoCount: images.length } }
  return delay({
    deletedCount: targets.length,
    revokedShareLinks: revoked,
    deletedRecommendations: body.keepResults ? 0 : 1,
  })
}

export const deleteAccount = (password: string): Promise<{ deleted: boolean }> => {
  if (password !== 'Passw0rd!') return fail(ERR.AUTH_001, '비밀번호가 일치하지 않습니다.')
  return delay({ deleted: true })
}
