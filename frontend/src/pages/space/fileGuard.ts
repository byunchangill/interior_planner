// 업로드 파일 사전 검증 + 서버 에러코드 → 사용자 메시지 (SPACE-003/004 공용)
import axios from 'axios'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20MB (계약)
const IMAGE_TYPES = ['image/jpeg', 'image/png']

// 클라이언트 사전검증. 통과 시 null, 실패 시 안내 메시지.
export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'JPG 또는 PNG 이미지만 업로드할 수 있습니다.'
  if (file.size > MAX_UPLOAD_BYTES) return '파일 용량은 20MB를 넘을 수 없습니다.'
  return null
}

// 서버 에러(VALID_002 형식/용량, VALID_003 장수초과, IMG_001 품질) → 안내 문구
export function uploadErrorMessage(err: unknown): string {
  const code = axios.isAxiosError(err)
    ? (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code
    : undefined
  switch (code) {
    case 'VALID_002':
      return '지원하지 않는 형식이거나 용량(20MB)을 초과했습니다.'
    case 'VALID_003':
      return '공간당 사진은 최대 10장까지 등록할 수 있습니다.'
    case 'IMG_001':
      return '이미지 품질이 낮아 분석이 어렵습니다. 밝은 곳에서 다시 촬영해 주세요.'
    default:
      return '업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
}
